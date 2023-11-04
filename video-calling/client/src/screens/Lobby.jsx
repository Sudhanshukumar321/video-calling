import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div className="w-[100%] h-[100vh] flex justify-center items-center bg-slate-500">
      <div className="flex justify-center items-center flex-col gap-y-20 p-10 pt-6 min-h-[50vh] min-w-[50%] bg-white">
        <h1 className="uppercase text-5xl font-bold text-red-500">Lobby</h1>
        <form
          onSubmit={handleSubmitForm}
          className="w-[100%] flex justify-center items-center flex-col gap-y-6"
        >
          <div className="flex flex-col w-[70%]">
            <label className="text-xl" htmlFor="email">
              Email ID
            </label>
            <input
              className="border-2 border-slate-400 w-[100%] p-2"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col w-[70%]">
            <label className="text-xl" htmlFor="room">
              Room Number
            </label>
            <input
              className="border-2 border-slate-400 w-[100%] p-2"
              type="text"
              id="room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </div>
          <button className="bg-red-300 hover:bg-red-500 w-[70%] p-2 text-white text-xl">Join</button>
        </form>
      </div>
    </div>
  );
};

export default LobbyScreen;
