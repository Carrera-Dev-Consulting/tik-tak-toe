'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinLobby() {
    const [lobbyCode, setLobbyCode] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!lobbyCode.trim()) {
            setError('Please enter a lobby code');
            return;
        }

        try {
            const response = await fetch('/api/lobby/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: lobbyCode }),
            });

            if (!response.ok) {
                throw new Error('Failed to join lobby');
            }

            router.push(`/game/${lobbyCode}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Join Lobby</h1>
                
                <form onSubmit={handleJoin} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Enter lobby code"
                        value={lobbyCode}
                        onChange={(e) => {
                            setLobbyCode(e.target.value.toUpperCase());
                            setError('');
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <button
                        type="submit"
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition"
                    >
                        Join Game
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600 text-sm">
                        Don't have a code? <a href="/" className="text-blue-500 hover:underline">Create a lobby</a>
                    </p>
                </div>
            </div>
        </div>
    );
}