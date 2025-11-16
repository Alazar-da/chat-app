export interface Message {
  id: string;
  text: string;
  senderId?: string;
  senderEmail?: string;
  useName?:string;
  imageUrl?:string;
  timestamp?: any;
}

export interface UserType{
  id:string;
    createdAt?:string;
displayName:string;
email:string;
photoURL?:string;
uid?:string;
updatedAt?:string;
username:string;
}

export interface ChatUser {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  isOnline?: boolean;
  lastSeen?: any;
}