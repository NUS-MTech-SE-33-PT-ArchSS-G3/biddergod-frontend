import outputs from "../amplify_outputs.json";
import {Amplify} from "aws-amplify";
import {useEffect, useState} from "react";
import type {AuthUser} from "aws-amplify/auth";
import {getCurrentUser, signOut, fetchUserAttributes} from "aws-amplify/auth";
import MainContent from "./components/MainContent.tsx";
import AuthenticatorWrapper from "./components/AuthenticatorWrapper.tsx";

Amplify.configure(outputs);

export interface UserWithEmail extends AuthUser {
    email?: string;
}

function App() {
    const [showAuth, setShowAuth] = useState(false);
    const [user, setUser] = useState<UserWithEmail | null>(null);

    useEffect(() => {
        void checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const currentUser = await getCurrentUser();
            const attributes = await fetchUserAttributes();
            const userWithEmail: UserWithEmail = {
                ...currentUser,
                email: attributes.email
            };
            setUser(userWithEmail);
        } catch {
            setUser(null);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            setUser(null);
            setShowAuth(false);
        } catch {
            setUser(null);
            setShowAuth(false);
        }
    };

    if (showAuth && !user) {
        return (
            <AuthenticatorWrapper setShowAuth={setShowAuth} setUser={setUser}/>
        );
    }

    return (
        <MainContent user={user} handleSignOut = {handleSignOut} setShowAuth={setShowAuth}/>
    );
}

export default App
