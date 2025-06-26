import express from 'express';
import Register from './register.js';
import Login from './login.js';
//import Map from './showmap.js';
import API from './api.js';
import types from './showmap.js';
import place from './place.js';


const router = express.Router();
router.use('/register', Register);
router.use('/login', Login);
//router.use('/map', Map);
router.use('/test',API);
router.use('/type',types);
router.use('/place',place);


export default router;
