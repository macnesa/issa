import '../style/custom.scss';
import { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../config/socket';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

// const baseUrl = 'http://localhost:3000';
const baseUrl = 'https://issa.rhazzid.site';

export default function Chat() {
  const {
    student: { studentDetail, classmate, loading, error },
  } = useSelector((state) => state);

  const [userId, setUserId] = useState(localStorage.userId);
  const [room, setJoinRoom] = useState('');
  const [allChat, setAllChat] = useState([]);
  const [message, setMessage] = useState('');
  // console.log(message, 'ini messagee');

  const teacherId = localStorage.teacherId;

  const getAllChat = async () => {
    try {
      const { data } = await axios.get(`${baseUrl}/chatParent/${userId}/${teacherId}`, {
        headers: {
          access_token: localStorage.access_token,
        },
      });
      if (!data.length) {
        setJoinRoom(`room ${userId * teacherId}`);
      } else {
        setAllChat(data);
        setJoinRoom(data[0]?.roomId);
      }
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    getAllChat();
  }, [userId]);

  const joinRoom = () => {
    socket.emit('join:room', room);
    console.log('masuk ', room);
  };

  useEffect(() => {
    joinRoom();
  }, [userId]);

  useEffect(() => {
    socket.on('resp:msg', (data) => {
      setAllChat(data);
    });
  }, []);

  const dataValue = (event) => {
    const { name, value } = event.target;
    const dataInput = {
      ...message,
      [name]: value,
    };
    setMessage(dataInput);
  };

  const handleNewMessage = async (event) => {
    event.preventDefault();
    setMessage({ message: '' });
    try {
      socket.emit('chat:msg', {
        msg: message,
        room: room,
        from: userId,
        to: teacherId,
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div clasName="  ">
      <div className=" grid h-[100vh] grid-rows-[max-content_1fr_max-content] border-black">
        {/* <div className="pl-4">
          <h5 class="text-xl mb-6 font-semibold tracking-tight   text-gray-900 dark:text-white"> Chat </h5>
        </div> */}

        <div class="flex border-t shadow-lg border-white py-2 pl-4 items-center space-x-4">
          <Link to="/">
            <ion-icon name="chevron-back"></ion-icon>
          </Link>
          <div className="w-10 h-10 rounded-full overflow-hidden ">
            <img className="w-[100%]" src="https://s3.ap-southeast-1.amazonaws.com/indosistem/smpnegeri1talawi/NGx2cjJoSmFVK3cwdFZsUzdzOHFndz09-60.JPG" alt="" />
          </div>
          <div class="font-medium dark:text-white">
            <div> {studentDetail?.Class?.Teacher?.name} </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Wali Kelas</div>
          </div>
        </div>

        <div
          id="chatArea"
          style={{
            backgroundImage: 'url(https://i.pinimg.com/736x/3d/8c/2f/3d8c2f2c82c1c9ef1e27be645cd1aa17.jpg)',
            backgroundSize: 'cover',
          }}
          className="  border-black overflow-scroll pb-10 "
        >
          {allChat.map((each, index) => {
            if (each.fromUserId == userId) {
              return (
                <div key={index} className="chat chat-end text-sm  ">
                  <div className="chat-bubble bg-white text-black   "> {each.message} </div>
                </div>
              );
            } else {
              return (
                <div key={index} className="chat chat-start text-sm">
                  <div className="chat-bubble bg-white text-black   ">{each.message}</div>
                </div>
              );
            }
          })}
        </div>

        <form className=" border-black fixed bottom-0 w-[100vw] ">
          <label htmlFor="chat" className="sr-only">
            Your message
          </label>
          <div className="flex items-center px-3 py-2  bg-gray-50 dark:bg-gray-700">
            <button type="button" className="inline-flex justify-center p-2 text-gray-500 rounded-lg cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600">
              <svg aria-hidden="true" className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <span className="sr-only">Upload image</span>
            </button>
            <button type="button" className="p-2 text-gray-500 rounded-lg cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600">
              <svg aria-hidden="true" className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="sr-only">Add emoji</span>
            </button>
            <textarea
              onChange={dataValue}
              value={message.message}
              name="message"
              id="chat"
              rows={1}
              className="block mx-4 p-2.5 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Your message..."
              // defaultValue={''}
            />
            <button onClick={handleNewMessage} type="submit" className="inline-flex justify-center p-2 text-blue-600 rounded-full cursor-pointer hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-600">
              <svg aria-hidden="true" className="w-6 h-6 rotate-90" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
              <span className="sr-only">Send message</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
