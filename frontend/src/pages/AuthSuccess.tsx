import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useJWTTokenStore } from '../store/jwtTokenStore';
import { useUserStore } from '../store/userStore';

export default function AuthSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const storeTokenInLS = useJWTTokenStore((state) => state.storeTokenInLS);
    const getUser = useUserStore((state) => state.getUser);

    useEffect(() => {
        // 1. Grab the token from the URL
        const token = searchParams.get('token');

        if (token) {
            // 2. Save it to Zustand / LocalStorage
            storeTokenInLS(token);

            // 3. Fetch the user's profile immediately so the app has their data
            getUser()
                .then(() => {
                    // 4. Send them to the dashboard
                    navigate('/dashboard'); 
                })
                .catch((err: any) => {
                    console.error("Failed to load user profile after login", err);
                    navigate('/login');
                });
        } else {
            // No token found, send back to login
            navigate('/login');
        }
    }, [searchParams, navigate, storeTokenInLS, getUser]);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
            <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xl">Authenticating... Please wait.</p>
            </div>
        </div>
    );
}
