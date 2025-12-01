import AuthRepository from '../repository/AuthRepository.js';

class AuthService {
    constructor() {
        this.repository = new AuthRepository();
    }

    async getUserByEmail(email) {
        return await this.repository.getByEmail(email);
    }

    async registerUser(uid, data) {
        return await this.repository.create(uid,data);
    }
}
export default AuthService;