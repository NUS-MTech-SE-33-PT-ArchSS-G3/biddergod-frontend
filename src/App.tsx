import outputs from "../amplify_outputs.json";
import {Amplify} from "aws-amplify";
import {useEffect, useState} from "react";
import type {AuthUser} from "aws-amplify/auth";
import {getCurrentUser, signOut} from "aws-amplify/auth";
import MainContent from "./components/MainContent.tsx";
import AuthenticatorWrapper from "./components/AuthenticatorWrapper.tsx";

Amplify.configure(outputs);

function App() {
    const [showAuth, setShowAuth] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        void checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
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
