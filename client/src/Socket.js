import { io } from "socket.io-client";

export const initSocket = async () => {
  const options = {
    reconnection: true,
    reconnectionAttempts: 10, // try 10 times
    reconnectionDelay: 1000, // 1 sec delay
    transports: ["websocket"],
  };

  const backendURL = process.env.REACT_APP_BACKEND_URL;

  const socket = io(backendURL, options);

  return socket;
};
