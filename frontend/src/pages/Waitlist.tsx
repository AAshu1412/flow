import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import { useJWTTokenStore } from "../store/jwtTokenStore";
import { Mail, ArrowRight, Loader2, CheckCircle } from "lucide-react";

export default function Waitlist() {
    const navigate = useNavigate();
    const waitlistRequest = useUserStore(state => state.waitlistRequest);
    const isAuthenticated = useJWTTokenStore(state => state.isAuthenticated);

    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (isAuthenticated()) {
            navigate("/dashboard", { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus("loading");
        setErrorMsg("");

        try {
            const isConflict = await waitlistRequest(email);
            if (isConflict) {
                navigate("/login");
            } else {
                setStatus("success");
            }
        } catch (error) {
            setStatus("error");
            setErrorMsg("An unexpected error occurred. Please try again later.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Nexus Flow</h1>
                    <p className="text-lg text-gray-400">Join the waitlist for early access to the next generation of automation.</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                    {status === "success" ? (
                        <div className="flex flex-col items-center justify-center text-center py-8">
                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle className="w-8 h-8 text-blue-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">You're on the list!</h2>
                            <p className="text-gray-400">We'll notify you as soon as a spot opens up.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
                                    placeholder="Enter your email address"
                                />
                            </div>

                            {status === "error" && (
                                <p className="text-red-400 text-sm text-center">{errorMsg}</p>
                            )}

                            <button
                                type="submit"
                                disabled={status === "loading" || !email}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-blue-500/20"
                            >
                                {status === "loading" ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Joining...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Join Waitlist</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center text-sm text-gray-600 mt-8">
                    Already have an account?{" "}
                    <button type="button" onClick={() => navigate("/login")} className="text-blue-500 hover:text-blue-400 transition-colors font-medium">Log in</button>
                </p>
            </div>
        </div>
    );
}
