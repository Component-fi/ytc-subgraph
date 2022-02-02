import { User } from "../../generated/schema";

export const ensureUser = (userId: string): User => {
    let user = User.load(userId);

    if (!user){
        user = new User(userId);
        user.save();
    }
    return user;
}
