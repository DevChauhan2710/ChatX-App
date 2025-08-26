import { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children })=>{

    //empty array
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null)
    //empty object
    const [unseenMessages, setUnseenMessages] = useState({})
    const {socket, axios} = useContext(AuthContext);



    // function to get all users for sidebar
    const getUsers = async () =>{

        try {
            //we are getting response from api! (saved as DATA)
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users)
                setUnseenMessages (data.unseenMessages)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    
    // function to get messages for selected user
    const getMessages = async (userId)=>{
        
        try {
            //we get some response from this api
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages (data.messages)
            }
        } catch (error) {
            toast.error(error.message);
        }
    }


    //we can send the message to the perticular user!!
    // function to send message to selected user
    const sendMessage = async (messageData)=>{

        try {
            const {data} = await axios.post(`/api/messages/send/${selectedUser._id}`
            ,messageData);
            
            if(data.success) {
                setMessages((prevMessages)=>[...prevMessages, data.newMessage])
            }else{
                toast.error(data.message);
            }
        
        } catch (error) {
            toast.error(error.message);
        }
    }


    
    // function to subscribe to messages for selected user
    //means getting new messages in real-time 
    const subscribeToMessages = async() =>{
        
        if(!socket) return;

        socket.on("newMessage", (newMessage)=>{
            if(selectedUser && newMessage.senderId === selectedUser._id){
                newMessage.seen = true;
                setMessages ((prevMessages)=> [...prevMessages, newMessage]);
                //call the api for mark the message
                axios.put(`/api/messages/mark/${newMessage._id}`);
            }else{
                //if newMessage.senderId does not equal to selectedUser._id
                setUnseenMessages ((prevUnseenMessages)=>({
                    ...prevUnseenMessages, [newMessage.senderId] :
                    prevUnseenMessages [newMessage.senderId] ? prevUnseenMessages
                    [newMessage.senderId] + 1: 1
                }));
            }
        })

    }



    // function to unsubscribe from messages
    const unsubscribeFromMessages = ()=>{
        
        if(socket) socket.off("newMessage");
    }



    //when ever we execute this suscribe or unsuscribe function on web page we use useEffect
    useEffect(()=>{
        subscribeToMessages();
        return ()=> unsubscribeFromMessages();
        //when ever socket or selectedUser is change at time this functions will be called!! (as per dependencies of useEffect)
    }, [socket, selectedUser])

    

    //access all of the functions
    const value = {
        messages, users, selectedUser, getUsers, getMessages, sendMessage, setSelectedUser, unseenMessages, setUnseenMessages
    } 
    
    return (
        
        <ChatContext.Provider value={value}>
            { children }
        </ChatContext.Provider>
    )

}


//by using this functions we can display the lists of users in Leftsidebar