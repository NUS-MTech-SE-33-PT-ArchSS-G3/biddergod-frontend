import {Authenticator} from "@aws-amplify/ui-react";
import type {AuthUser} from "aws-amplify/auth";
import './AuthenticatorWrapper.css';
import '@aws-amplify/ui-react/styles.css';

interface AuthenticatorWrapperProps {
    setShowAuth: (value: boolean) => void;
    setUser: (user: AuthUser | null) => void;
}

export default function AuthenticatorWrapper({setUser, setShowAuth}: AuthenticatorWrapperProps) {
    return (
        <div className="authenticator-wrapper">
            <Authenticator>
                {({user: authUser}) => {
                    if (authUser) {
                        setUser(authUser);
                        setShowAuth(false);
                    }
                    return <div>Setting up...</div>;
                }}
            </Authenticator>
        </div>
    )
}