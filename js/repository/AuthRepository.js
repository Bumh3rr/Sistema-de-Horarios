import { db } from "../config/firebase-config.js";
import {
    collection,
    setDoc,
    doc,
    getDocs,
    query,
    orderBy,
    getDoc,
    updateDoc,
    deleteDoc,
    where,
    Timestamp,
    addDoc
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

class AuthRepository {
    // Constructor de la clase ClienteRepository
    constructor() {
        this.collectionName = "users";
        this.collection = collection(db, this.collectionName);
    }

    async getByEmail(email) {
        try {
            const q = query(this.collection, where("email", "==", email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                // Asumimos que el email es único, por lo que retornamos el primer documento encontrado
                const docSnap = querySnapshot.docs[0];
                return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
            } else {
                return { success: false, message: "No se encontró ningún usuario con ese email." };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async create(uid, data) {
        try {
            const docRef = doc(db, this.collectionName, uid);
            await setDoc(docRef, data);
            return { success: true, id: uid };
        } catch (error) {
            return { success: false, message: error.message || String(error) };
        }
    }

}
export default AuthRepository;