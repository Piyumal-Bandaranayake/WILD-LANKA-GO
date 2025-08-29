import express, { Router } from "express";
import { registerTourGuide} from "../../controllers/user/tourGuidecontroller.js";


const router=express.Router();


router.post('/register', registerTourGuide);

export default Router;