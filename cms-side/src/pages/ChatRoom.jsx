import { tw } from "../shared/ui/tw";
import Icon from "../shared/ui/Icon";
import { useState, useEffect } from 'react';
import axios, { all } from 'axios';
import socket from '../config/socket';
import baseUrl from '../config/api';

// let teacher = { id: 1, NIP: '1800011221', name: 'Sumiyati' };

export default function ChatRoom(params) {
  const [parents, setParents] = useState([]);
  const [allChat, setAllChat] = useState([]);
  const [message, setMessage] = useState('');
  const [room, setJoinRoom] = useState('');
  const [user, setUser] = useState({});
  const teacherId = localStorage.TeacherId;

  const listParents = async () => {
    try {
      const { data } = await axios.get(`${baseUrl}/chatTeacher/${teacherId}`, {
        headers: {
          access_token: localStorage.access_token,
        },
      });
      console.log(data, 'data parents');
      setParents(data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    listParents();
  }, []);

  const getAllChat = async () => {
    try {
      const { data } = await axios.get(`${baseUrl}/chatTeacher/${teacherId}/${user.fromUserId}`, {
        headers: {
          access_token: localStorage.access_token,
        },
      });
      // console.log(data, 'dataaaa');
      setAllChat(data);
      setJoinRoom(data[0].roomId);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getAllChat();
  }, [user]);

  const dataValue = (event) => {
    const { name, value } = event.target;
    const dataInput = {
      ...message,
      [name]: value,
    };
    setMessage(dataInput);
  };

  const joinRoom = (detail) => {
    // console.log(detail, 'detailll');
    // setUser(detail);
    console.log('masuk ', room);
    socket.emit('join:room', room);
  };

  useEffect(() => {
    joinRoom();
  }, [user]);

  console.log(user, 'userrr');
  const handleNewMessage = async (event) => {
    event.preventDefault();
    // const dataMsg = { from: teacher.id, to: user.id, message: message.message };
    setMessage({ message: '' });
    try {
      // const { data } = await axios.post(`${baseUrl}/chats`, dataMsg);
      // gaperlu karena, uda dihandle sama socket
      socket.emit('chat:msg', { msg: message, room: room, from: teacherId, to: user.fromUserId });
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    socket.on('resp:msg', (data) => {
      console.log(data, '<<<<< nich');
      setAllChat(data);
    });
  }, [message]);

  return (
    <>
      <div className={tw("flex h-screen antialiased text-gray-800 mx-auto")}>
        <div className={tw("flex flex-row h-full w-full overflow-x-hidden")}>
          <div className={tw("flex flex-col py-8 pl-6 pr-2 w-64 bg-white flex-shrink-0 dark:bg-gray-900")}>
            <div className={tw("flex flex-col mt-8 ")}>
              <div className={tw("flex flex-col space-y-1 mt-4 -mx-2")}>
                <div className={tw("flex flex-row items-center justify-center h-12 w-full mb-[2rem]")}>
                  <div className={tw("flex items-center justify-center rounded-2xl text-white bg-gray-900 h-10 w-10  dark:text-gray-800 dark:bg-white")}>
                    <svg className={tw("w-6 h-6")} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                    </svg>
                  </div>
                  <div className={tw("ml-2 font-bold text-2xl dark:text-white text-gray-800")}>Chat</div>
                </div>
                <div>
                  {parents?.map((x, i) => {
                    console.log(x, 'xxx');
                    return (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.preventDefault();
                          // joinRoom(x);
                          setUser(x);
                          setJoinRoom(x.roomId);
                        }}
                        className={tw("flex flex-row items-center rounded-xl p-2 hover:bg-gray-400 active:bg-gray-400 focus:bg-gray-400")}
                      >
                        <div className={tw("flex items-center justify-center text-white h-8 w-8 bg-gray-900 dark:bg-white rounded-full dark:text-gray-900")}>
                          <Icon name="person" />
                        </div>

                        <div className={tw("ml-2 text-sm font-semibold text-gray-800 dark:text-white")}>{x.parentName[0].Student.name}'s parent</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className={tw("flex h-full p-12 w-full ")}>
            <div className={tw("flex flex-col flex-auto flex-shrink-0 rounded-2xl bg-gray-100 h-full w-full p-4 justify-center dark:bg-gray-500")}>
              <div className={tw("flex flex-col h-full w-full overflow-x-auto mb-4")}>
                <div className={tw("flex flex-col h-full")}>
                  <div className={tw("grid grid-cols-12 gap-y-2")}>
                    {allChat?.map((x, i) => {
                      if (x.fromUserId != teacherId || x.toUserId == teacherId) {
                        return (
                          <div key={i} className={tw("col-start-1 col-end-8 p-3 rounded-lg")}>
                            <div className={tw("flex flex-row items-center")}>
                              <div className={tw("flex items-center justify-center h-10 w-10 rounded-full bg-gray-900 flex-shrink-0  text-white dark:text-white")}>
                                <Icon name="person" />
                              </div>
                              <div className={tw("relative ml-3 text-sm bg-white py-2 px-4 shadow rounded-xl")}>
                                <div>{x.message}</div>
                              </div>
                            </div>
                          </div>
                        );
                      } else if (x.fromUserId == teacherId) {
                        return (
                          <div key={i} className={tw("col-start-6 col-end-13 p-3 rounded-lg")}>
                            <div className={tw("flex items-center justify-start flex-row-reverse")}>
                              <div className={tw("flex items-center justify-center h-10 w-10 rounded-full bg-gray-900 text-white dark:text-white flex-shrink-0")}>
                                <Icon name="account_circle" />
                              </div>
                              <div className={tw("relative mr-3 text-sm bg-indigo-100 py-2 px-4 shadow rounded-xl")}>
                                <div>{x.message}</div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              </div>
              <div className={tw("flex flex-row items-center h-16 rounded-xl bg-white w-full px-4")}>
                <div>
                  <button className={tw("flex items-center justify-center text-gray-400 hover:text-gray-600")}>
                    <svg className={tw("w-5 h-5")} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                    </svg>
                  </button>
                </div>
                <div className={tw("flex-grow ml-4")}>
                  <div className={tw("relative w-full")}>
                    <input onChange={dataValue} value={message.message} name="message" type="text" className={tw("flex w-full border rounded-xl focus:outline-none focus:border-indigo-300 pl-4 h-10")} />
                    <button className={tw("absolute flex items-center justify-center h-full w-12 right-0 top-0 text-gray-400 hover:text-gray-600")}></button>
                  </div>
                </div>
                <div className={tw("ml-4")}>
                  <button onClick={handleNewMessage} className={tw("flex items-center justify-center bg-gray-900 hover:bg-gray-800 rounded-xl text-white px-4 py-1 flex-shrink-0 dark:text-white")}>
                    <span>Send</span>
                    <span className={tw("ml-2")}>
                      <svg className={tw("w-4 h-4 transform rotate-45 -mt-px")} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
