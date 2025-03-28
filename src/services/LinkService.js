export class LinkService {
    constructor(linkModel) {
        this.linkModel = linkModel;
    }
    
    async createLink(data) {
        try {
        const newLink = await this.linkModel.create(data);
        return { status: 200, data: newLink };
        } catch (error) {
        console.error("Error creating link:", error);
        throw error;
        }
    }
    
    async getLink(query) {
        try {
        const link = await this.linkModel.findOne({ where: query });
        if (!link) {
            return { status: 404, message: "Link not found" };
        }
        return { status: 200, data: link };
        } catch (error) {
        console.error("Error fetching link:", error);
        throw error;
        }
    }
    }