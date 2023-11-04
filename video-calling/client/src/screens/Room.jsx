import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";
import { useParams } from "react-router-dom";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const { roomId } = useParams();

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  return (
    <div className="w-[100%]  h-[100%] flex justify-center bg-white">
      <div className="bg-slate-200 lg:w-[80%] w-[100%] h-[100%] flex  items-center flex-col gap-y-10 p-10 pt-6 ">
        <h1 className="uppercase text-5xl font-bold text-red-500 mt-4">
          Room Number: {roomId}
        </h1>
        <h4 className="italic text-gray-500 text-xl mb-8">
          {remoteSocketId ? "Connected" : "No one in room"}
        </h4>
        <div className="lg:w-[50%] w-[90%] flex flex-col item-center text-center">
          {myStream && (
            <button onClick={sendStreams} className="p-2 bg-red-300 lg:w-[100%] mb-4">
              Send Stream
            </button>
          )}
          {remoteSocketId && (
            <button onClick={handleCallUser} className="p-2 bg-red-300 lg:w-[100%]">
              CALL
            </button>
          )}
        </div>
        <div className="lg:flex lg:justify-between   lg:w-[80%] w-[95%] ">
          {myStream && (
            <div className="mr-4 flex flex-col justify-center items-center w-[100%]">
              <h1 className="font-bold text-3xl">My Stream</h1>
              <div>
              <ReactPlayer
                playing
                muted
                height="auto"
                width="auto"
                url={myStream}
              />
              </div>
            </div>
          )}
          {remoteStream && (
            <div className="mt-6 flex flex-col justify-center items-center w-[100%]">
            <h1 className="font-bold text-3xl">Remote Stream</h1>
               <ReactPlayer
                playing
                muted
                height="auto"
                width="auto"
                url={remoteStream}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
