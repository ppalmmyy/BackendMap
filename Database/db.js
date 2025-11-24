import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

const DB = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '6530300163', 
  database: 'map', 
  waitForConnections: true,
  connectionLimit: 10,
});

export const insertUser = async ({ name, email, password, confirmPassword }) => {
  // ตรวจสอบรหัสผ่านตรงกัน
  if (password !== confirmPassword) {
    return { success: false, message: 'รหัสผ่านไม่ตรงกัน' };
  }

  // ตรวจสอบความยาวรหัสผ่าน
  if (password.length <= 5) {
    return { success: false, message: 'รหัสผ่านต้องมีความยาวมากกว่า 5 ตัวอักษร' };
  }

  const user_id = 'u' + uuidv4().replace(/-/g, '').substring(0, 8);
  const register_date = new Date().toISOString().split('T')[0];

  try {
    // ตรวจสอบอีเมลซ้ำ
    const [existingUser] = await DB.execute(
      'SELECT user_id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (existingUser.length > 0) {
      return { success: false, message: 'อีเมลนี้ถูกใช้งานไปแล้ว' };
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const sql = `
      INSERT INTO users (user_id, name, email, password, register_date)
      VALUES (?, ?, ?, ?, ?)
    `;

    await DB.execute(sql, [user_id, name, email, hashedPassword, register_date]);

    return {
      success: true,
      user: { user_id, name, email, register_date },
    };
  } catch (err) {
    console.error('DB Error:', err);
    return { success: false, message: 'ไม่สามารถบันทึกข้อมูลได้' };
  }
};

// ฟังก์ชันดึง user ทั้งหมด
export const getAllUsers = async () => {
  try {
    const sql = 'SELECT * FROM users';
    const [row] = await DB.execute(sql);

    console.log('ข้อมูลทั้งหมดในตาราง users:', row);

    return {
      success: true,
      users: row,
    };
  } catch (err) {
    console.error('ดึงข้อมูลล้มเหลว:', err);
    return { success: false, message: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้' };
  }
};

// ฟังก์ชันตรวจสอบ login
export const checkUserLogin = async (email, password) => {
  try {
    const sql = `SELECT * FROM users WHERE email = ?`;
    const [rows] = await DB.execute(sql, [email]);

    if (rows.length === 0) {
      return { success: false, message: 'ไม่พบอีเมลนี้ในระบบ' };
    }

    const user = rows[0];
    console.log('User password hash from DB:', user.password);

    if (!password || !user.password) {
      return { success: false, message: 'ข้อมูลรหัสผ่านไม่ครบถ้วน' };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', passwordMatch);

    if (!passwordMatch) {
      return { success: false, message: 'รหัสผ่านไม่ถูกต้อง' };
    }

    return {
      success: true,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        register_date: user.register_date
      }
    };
  } catch (err) {
    console.error('Login Error:', err);
    return { success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบผู้ใช้' };
  }
};

// ฟังก์ชันเพิ่มประเภท types เข้า DB ถ้ายังไม่มี
export const insertTypes = async () => {
  const typesList = [
    'Art and Culture',
    'Park',
    'Nature',
    'Museum',
    'Temple'
  ];

  const conn = await DB.getConnection();

  try {
    await conn.beginTransaction(); // ✅ เริ่ม transaction

    for (const typeName of typesList) {
      const [existing] = await conn.query(
        'SELECT id_type FROM types WHERE LOWER(types) = LOWER(?) LIMIT 1',
        [typeName]
      );

      if (existing.length > 0) {
        console.log(`✅ ประเภท "${typeName}" มีอยู่แล้ว`);
        continue;
      }

      const id_type = uuidv4();
      await conn.query(
        `INSERT INTO types (id_type, types) VALUES (?, ?)`,
        [id_type, typeName]
      );
      console.log(`🎉 เพิ่มประเภทใหม่: ${typeName}`);
    }

    await conn.commit(); // ✅ บันทึกให้สมบูรณ์
    return { success: true, message: 'เพิ่ม types สำเร็จทั้งหมด' };

  } catch (err) {
    await conn.rollback(); // ⛔ ย้อนกลับถ้ามี error
    console.error('❌ insertTypes Error:', err);
    return { success: false, message: 'เกิดข้อผิดพลาดในการเพิ่ม types' };

  } finally {
    conn.release();
  }
};


insertTypes()
  .then(res => console.log(res.message))
  .catch(err => console.error('insertTypes error:', err));

// แผนที่ประเภทจาก Google มาเป็นชื่อในฐานข้อมูล
const mapTypeKeywords = {
  park: 'สวนสาธารณะ',
  museum: 'พิพิธภัณฑ์',
  place_of_worship: 'วัด',
  natural_feature: 'ธรรมชาติและพฤกษศาสตร์',
  art_gallery: 'ศิลปวัฒนธรรมและประติมากรรม'
};

// ฟังก์ชันแมปประเภท
const matchTypeFromGoogle = (types) => {
  if (typeof types === 'string') {
    return types; // กรณีที่ข้อมูลตรงกับชื่อใน DB แล้ว
  }
  if (Array.isArray(types)) {
    for (const type of types) {
      if (mapTypeKeywords[type]) {
        return mapTypeKeywords[type];
      }
    }
  }
  return null;
};

// ฟังก์ชัน insert สถานที่จาก JSON
const insertPlacesFromJson = async () => {
  let data;
  try {
    const filePath = path.resolve('Database/api.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    data = JSON.parse(fileContent);
  } catch (err) {
    console.error('อ่านไฟล์ JSON ไม่สำเร็จ:', err);
    return;
  }

  const conn = await DB.getConnection();

  try {
    const fixedUserId = 'api123456789';

    for (const place of data) {
      console.log('กำลังเพิ่มสถานที่:', place.name);

      const [existing] = await conn.query(
        `SELECT id_place FROM place WHERE name = ? LIMIT 1`,
        [place.name]
      );
      if (existing.length > 0) {
        console.log(`สถานที่ "${place.name}" มีอยู่แล้ว`);
        continue;
      }

      const matchedType = matchTypeFromGoogle(place.types);
      console.log('Matched Type:', matchedType, 'สำหรับสถานที่:', place.name);

      if (!matchedType) {
        console.log(`❌ ไม่พบประเภทที่ตรงกันสำหรับสถานที่: "${place.name}"`);
        continue;
      }

      const [typeResult] = await conn.query(
        `SELECT id_type FROM types WHERE LOWER(types) = LOWER(?) LIMIT 1`,
        [matchedType]
      );
      console.log('Type Result:', typeResult);

      if (typeResult.length === 0) {
        console.log(`❌ ไม่มี id_type สำหรับประเภท "${matchedType}"`);
        continue;
      }

      const id_type = typeResult[0].id_type;
      console.log('id_type ที่ได้:', id_type);

      const id_place = uuidv4();
      const id_between = uuidv4();
      const lat = place.location?.lat ?? 0;
      const longji = place.location?.lng ?? 0;
      const address = place.address ?? 'ไม่มีข้อมูลที่อยู่';
      const date = new Date().toISOString().split('T')[0];
      const image = place.image || null;

      await conn.beginTransaction();

      try {
        await conn.query(
          `INSERT INTO place (id_place, name, lat, longji, date, image, address_place, id_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id_place, place.name, lat, longji, date, image, address, id_type]
        );

        await conn.query(
          `INSERT INTO \`between\` (id_between, Users_user_id, place_id_place)
           VALUES (?, ?, ?)`,
          [id_between, fixedUserId, id_place]
        );

        await conn.commit();
        console.log(`✅ เพิ่มสถานที่: ${place.name} (${matchedType})`);
      } catch (err) {
        await conn.rollback();
        console.error(`❌ Insert transaction ล้มเหลวสำหรับสถานที่ "${place.name}":`, err.sqlMessage || err.message);
      }
    }

    return { message: `🎉 เพิ่มสถานที่ใหม่ที่ไม่ซ้ำทั้งหมดเรียบร้อยแล้ว` };
  } catch (err) {
    console.error('❌ Error inserting places:', err.sqlMessage || err.message || err);
    throw err;
  } finally {
    conn.release();
  }
};

// เรียกใช้ insertPlacesFromJson เมื่อเริ่มโปรเจกต์
insertPlacesFromJson()
  .then(result => console.log(result.message))
  .catch(err => console.error('insertPlacesFromJson error:', err));

  export const getTypes = async () => {
  try {
    const sql = 'SELECT * FROM types';
    const [row] = await DB.execute(sql);

    console.log('ข้อมูลทั้งหมดในตาราง users:', row);

    return {
      success: true,
      types: row,
    };
  } catch (err) {
    console.error('ดึงข้อมูลล้มเหลว:', err);
    return { success: false, message: 'ไม่สามารถดึงประเภทได้' };
  }
};

export const getPlaces = async () => {
  try {
    const sql = `
      SELECT 
        place.*,
        
        types.types 
      FROM 
        place 
      JOIN 
        types
      ON 
        place.id_type = types.id_type
    `;
    const [rows] = await DB.execute(sql);

    console.log('📌 ข้อมูลสถานที่ทั้งหมด:', rows);

    return {
      success: true,
      places: rows, // ส่งออกด้วย key ชื่อ places
    };
  } catch (err) {
    console.error('❌ ดึงข้อมูลล้มเหลว:', err);
    return { success: false, message: 'ไม่สามารถดึงข้อมูลสถานที่ได้' };
  }
};

// ====== ทริป + จุดแวะ ======

// สร้างทริปใหม่
export const createTrip = async ({ user_id, name, startLat, startLng, endLat, endLng }) => {
  const id_trip = uuidv4();

  try {
    const sql = `
      INSERT INTO trip (id_trip, user_id, name, start_lat, start_lng, end_lat, end_lng)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await DB.execute(sql, [
      id_trip,
      user_id,
      name || null,
      startLat ?? null,
      startLng ?? null,
      endLat ?? null,
      endLng ?? null
    ]);

    return {
      success: true,
      trip: { id_trip, user_id, name, startLat, startLng, endLat, endLng }
    };
  } catch (err) {
    console.error('createTrip Error:', err);
    return { success: false, message: 'ไม่สามารถสร้างทริปได้' };
  }
};

// เพิ่มจุดแวะให้ทริป
export const addTripStops = async (id_trip, stops = []) => {
  if (!id_trip || !Array.isArray(stops) || stops.length === 0) {
    return { success: false, message: 'ข้อมูลจุดแวะไม่ถูกต้อง' };
  }

  const conn = await DB.getConnection();

  try {
    await conn.beginTransaction();

    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      const id_stop = uuidv4();
      const stop_order = i + 1;

      const place_id_place = stop.place_id_place || null;
      const custom_name   = stop.custom_name || null;
      const custom_lat    = stop.custom_lat ?? null;
      const custom_lng    = stop.custom_lng ?? null;
      const stay_minutes  = stop.stay_minutes ?? 0;

      await conn.query(
        `INSERT INTO trip_stop 
          (id_stop, id_trip, place_id_place, custom_name, custom_lat, custom_lng, stop_order, stay_minutes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id_stop, id_trip, place_id_place, custom_name, custom_lat, custom_lng, stop_order, stay_minutes]
      );
    }

    await conn.commit();
    return { success: true, message: 'เพิ่มจุดแวะสำเร็จ' };
  } catch (err) {
    await conn.rollback();
    console.error('addTripStops Error:', err);
    return { success: false, message: 'ไม่สามารถเพิ่มจุดแวะได้' };
  } finally {
    conn.release();
  }
};

// ดึงทริป + จุดแวะทั้งหมด
export const getTripWithStops = async (id_trip) => {
  try {
    const [tripRows] = await DB.execute(
      `SELECT * FROM trip WHERE id_trip = ? LIMIT 1`,
      [id_trip]
    );

    if (tripRows.length === 0) {
      return { success: false, message: 'ไม่พบทริปนี้' };
    }

    const trip = tripRows[0];

    const [stopRows] = await DB.execute(
      `SELECT ts.*, p.name AS place_name
       FROM trip_stop ts
       LEFT JOIN place p ON ts.place_id_place = p.id_place
       WHERE ts.id_trip = ?
       ORDER BY ts.stop_order ASC`,
      [id_trip]
    );

    return {
      success: true,
      trip: {
        ...trip,
        stops: stopRows
      }
    };
  } catch (err) {
    console.error('getTripWithStops Error:', err);
    return { success: false, message: 'ไม่สามารถดึงข้อมูลทริปได้' };
  }
};




export default DB;
