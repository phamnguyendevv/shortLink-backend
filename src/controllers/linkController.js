import {LinkService} from "../services/linkService.js";
import HTTP_STATUS from "../constants/httpStatus.js";




const linkService = new LinkService();

let linkController = {
    createLink: async (req, res, next) => {
        try {
        const result = await linkService.createLink(req.body);
        return res.status(result.status || HTTP_STATUS.OK).json(result);
        } catch (error) {
        next(error);
        }
    },
    
    getLink: async (req, res, next) => {
        try {
        const result = await linkService.getLink(req.query);
        return res.status(result.status || HTTP_STATUS.OK).json(result);
        } catch (error) {
        next(error);
        }
    },
    };


    
export default linkController;  