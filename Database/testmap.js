/*
import axios from 'axios';

const apiKey = 'AIzaSyDJeEoXWLe39SLiburg471WmeewKu69eJg'; // ใส่ API Key ของคุณ

const getAllPlaces = async (nextPageToken = '') => {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json`;

  try {
    const params = {
      query: 'สถานที่ท่องเที่ยว ชลบุรี',
      type: 'tourist_attraction',
      key: apiKey,
      language: 'th',
    };

    if (nextPageToken) {
      params.pagetoken = nextPageToken;
    }

    const res = await axios.get(url, { params });

    const places = res.data.results;
    const newNextPageToken = res.data.next_page_token || null;

    if (places.length > 0) {
      return {
        success: true,
        places: places.map(p => ({
          name: p.name,
          address: p.formatted_address,
          rating: p.rating || null,
          location: p.geometry.location,
          photo_reference: p.photos?.[0]?.photo_reference || null, 
        })),
        nextPageToken: newNextPageToken,
      };
    } else {
      return { success: false, message: 'ไม่พบสถานที่ท่องเที่ยวในชลบุรี' };
    }

  } catch (err) {
    return { success: false, message: err.message };
  }
};



export default getAllPlaces;
*/