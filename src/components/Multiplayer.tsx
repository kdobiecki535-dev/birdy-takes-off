import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Difficulty } from "@/types/game";

interface MultiplayerProps {
  onBack: () => void;
  onStartGame: (roomId: string, seed: string, difficulty: string) => void;
  userId: string;
}

interface Room {
  id: string;
  room_code: string;
  difficulty: string;
  status: string;
  host_id: string;
  seed: string;
  profiles: {
    username: string;
  };
}

export const Multiplayer = ({ onBack, onStartGame, userId }: MultiplayerProps) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomCode, setRoomCode] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRooms();
    
    const channel = supabase
      .channel("multiplayer-rooms")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "multiplayer_rooms",
        },
        () => fetchRooms()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRooms = async () => {
    const { data } = await supabase
      .from("multiplayer_rooms")
      .select("*, profiles(username)")
      .eq("status", "waiting")
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) setRooms(data);
  };

  const createRoom = async () => {
    setLoading(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const seed = Math.random().toString(36).substring(7);

    const { data, error } = await supabase
      .from("multiplayer_rooms")
      .insert({
        room_code: code,
        host_id: userId,
        difficulty,
        seed,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create room");
      setLoading(false);
      return;
    }

    if (data) {
      await supabase.from("room_participants").insert({
        room_id: data.id,
        user_id: userId,
      });

      toast.success(`Room created! Code: ${code}`);
      onStartGame(data.id, data.seed, data.difficulty);
    }
    setLoading(false);
  };

  const joinRoom = async (room: Room) => {
    setLoading(true);
    const { error } = await supabase.from("room_participants").insert({
      room_id: room.id,
      user_id: userId,
    });

    if (error) {
      toast.error("Failed to join room");
      setLoading(false);
      return;
    }

    toast.success("Joined room!");
    onStartGame(room.id, room.seed, room.difficulty);
    setLoading(false);
  };

  const joinByCode = async () => {
    if (!roomCode) return;
    
    setLoading(true);
    const { data: room } = await supabase
      .from("multiplayer_rooms")
      .select("*")
      .eq("room_code", roomCode.toUpperCase())
      .eq("status", "waiting")
      .single();

    if (!room) {
      toast.error("Room not found");
      setLoading(false);
      return;
    }

    await joinRoom(room as any);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
      <div className="bg-white/90 p-8 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
        <h2 className="pixel-text text-4xl mb-6 text-center text-primary">Multiplayer</h2>

        <div className="space-y-4 mb-6">
          <div className="flex gap-2">
            <Input
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="pixel-text"
            />
            <Button onClick={joinByCode} disabled={loading} className="pixel-text">
              Join
            </Button>
          </div>

          <Button onClick={createRoom} disabled={loading} className="w-full pixel-text">
            Create New Room ({difficulty})
          </Button>
        </div>

        <div className="mb-6">
          <h3 className="pixel-text text-xl mb-3">Available Rooms</h3>
          {rooms.length === 0 ? (
            <p className="pixel-text text-center text-gray-600">No rooms available. Create one!</p>
          ) : (
            <div className="space-y-2">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-3 bg-white rounded border-2 border-black"
                >
                  <div>
                    <p className="pixel-text font-bold">{room.room_code}</p>
                    <p className="pixel-text text-sm text-gray-600">
                      Host: {room.profiles.username} • {room.difficulty}
                    </p>
                  </div>
                  <Button
                    onClick={() => joinRoom(room)}
                    disabled={loading}
                    size="sm"
                    className="pixel-text"
                  >
                    Join
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button onClick={onBack} variant="outline" className="w-full pixel-text">
          Back to Menu
        </Button>
      </div>
    </div>
  );
};
