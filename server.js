const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const dotenv = require('dotenv');
const { fireBaseConnection } = require('./utils/fbConnect');
const mongoose = require('mongoose');
const User = require('./models/User');
const Message = require('./models/Message'); 
const sendNotification = require('./utils/sendNotification');


dotenv.config()

fireBaseConnection();


const port = process.env.PORT || 3000; 

mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("connected to the db")).catch((err) => { console.log(err) });


const ioServer = http.createServer(); // Tạo một HTTP server riêng cho Socket.io
const io = new Server(ioServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST","PUT","DELETE"],
    allowedHeaders: ["Content-Type"],
},
});

// Xử lý các sự kiện `Socket.io`
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('send_message_res_client', async (data) => {
      const { restaurantId, customerId, message, sender } = data;
    
      // Làm sạch giá trị của customerId
      const cleanedCustomerId = customerId.replace(/"/g, '').trim(); // Loại bỏ dấu nháy kép và khoảng trắng
    
      const newMessage = new Message({restaurantId, customerId: cleanedCustomerId, message, sender, isRead: 'unread' });
      
      try {
        await newMessage.save();
        const room = `${restaurantId}_${cleanedCustomerId}`;
        io.to(room).emit('receive_message_res_client', newMessage);
      } catch (err) {
        console.error('Error saving message:', err);
      }
    });

    socket.on('send_unread_notification_res_to_client', async (data) => {
      const { customerId, restaurantId, message } = data;
      try{
        const user = await User.findById(customerId, { fcm: 1 });
        if (user) {
          if (user.fcm || user.fcm !== null || user.fcm !== '') {
            sendNotification(user.fcm,`${message}`, data, `Restaurant sent you a message`);
        }
        }
      }catch(err){
        console.error('Error getting user:', err);
      }
    });
    socket.on('send_unread_notification_client_to_res', async (data) => {
      const { customerId, restaurantId, message } = data;
      try{
        const user = await User.findById(restaurantId, { fcm: 1 });
        if (user) {
          if (user.fcm || user.fcm !== null || user.fcm !== '') {
            sendNotification(user.fcm,`${message}`, data, `Customer sent you a message`);
        }
        }
      }catch(err){
        console.error('Error getting user:', err);
      }
    });
    socket.on('send_unread_notification_res_to_driver', async (data) => {
      const { driverId, restaurantId, message } = data;
      try{
        const user = await User.findById(driverId, { fcm: 1 });
        if (user) {
          if (user.fcm || user.fcm !== null || user.fcm !== '') {
            sendNotification(user.fcm,`${message}`, data, `Restaurant sent you a message`);
        }
        }
      }catch(err){
        console.error('Error getting user:', err);
      }
    });
    socket.on('send_unread_notification_driver_to_res', async (data) => {
      const { driverId, restaurantId, message } = data;
      try{
        const user = await User.findById(restaurantId, { fcm: 1 });
        if (user) {
          if (user.fcm || user.fcm !== null || user.fcm !== '') {
            sendNotification(user.fcm,`${message}`, data, `Restaurant sent you a message`);
        }
        }
      }catch(err){
        console.error('Error getting user:', err);
      }
    });
    socket.on('send_unread_notification_cus_to_driver', async (data) => {
      const { driverId, customerId, message } = data;
      try{
        const user = await User.findById(driverId, { fcm: 1 });
        if (user) {
          if (user.fcm || user.fcm !== null || user.fcm !== '') {
            sendNotification(user.fcm,`${message}`, data, `Customer sent you a message`);
        }
        }
      }catch(err){
        console.error('Error getting user:', err);
      }
    });

    socket.on('send_unread_notification_driver_to_cus', async (data) => {
      const { driverId, customerId, message } = data;
      try{
        const user = await User.findById(customerId, { fcm: 1 });
        if (user) {
          if (user.fcm || user.fcm !== null || user.fcm !== '') {
            sendNotification(user.fcm,`${message}`, data, `customer sent you a message`);
        }
        }
      }catch(err){
        console.error('Error getting user:', err);
      }
    });

    socket.on('send_message_driver_client', async (data) => {
      const {driverId, customerId, message, sender } = data;
    
      // Làm sạch giá trị của customerId
      const cleanedCustomerId = customerId.replace(/"/g, '').trim(); // Loại bỏ dấu nháy kép và khoảng trắng
    
      const newMessage = new Message({driverId, customerId: cleanedCustomerId, message, sender , isRead: 'unread'});
      
      try {
        await newMessage.save();
        const room = `${driverId}_${cleanedCustomerId}`;
        io.to(room).emit('receive_message_driver_client', newMessage);
      } catch (err) {
        console.error('Error saving message:', err);
      }
    });
    socket.on('send_message_driver_res', async (data) => {
      const {driverId, restaurantId, message, sender } = data;
    
      // Làm sạch giá trị của customerId
      const cleanedCustomerId = restaurantId.replace(/"/g, '').trim(); // Loại bỏ dấu nháy kép và khoảng trắng
    
      const newMessage = new Message({driverId, restaurantId: cleanedCustomerId, message, sender , isRead: 'unread'});
      
      try {
        await newMessage.save();
        const room = `${restaurantId}_${driverId}`;
        io.to(room).emit('receive_message_driver_res', newMessage);
      } catch (err) {
        console.error('Error saving message:', err);
      }
    });
    
    socket.on('edit_message_res_client', async (data) => {
      const { restaurantId, customerId, messageId, message } = data;
      console.log(data);
      // Clean the customerId
     
      const cleanedCustomerId = customerId.replace(/"/g, '').trim();
      try {
        const updatedMessage = await Message.findByIdAndUpdate(
          messageId,
          { message },
          { new: true }
        );
    
        const room = `${restaurantId}_${cleanedCustomerId}`;
        io.to(room).emit('receive_message_res_client', updatedMessage);
      } catch (err) {
        console.error('Error updating message:', err);
      }
    });

    socket.on('edit_message_res_driver', async (data) => {
      const { restaurantId, driverId, messageId, message } = data;
      console.log(data);
      // Clean the customerId
     
      const cleanedCustomerId = driverId.replace(/"/g, '').trim();
      try {
        const updatedMessage = await Message.findByIdAndUpdate(
          messageId,
          { message },
          { new: true }
        );
    
        const room = `${restaurantId}_${cleanedCustomerId}`;
        io.to(room).emit('receive_message_driver_res', updatedMessage);
      } catch (err) {
        console.error('Error updating message:', err);
      }
    });

    socket.on('edit_message_driver_client', async (data) => {
      const { driverId, customerId, messageId, message } = data;
      console.log(data);
      // Clean the customerId
     
      const cleanedCustomerId = customerId.replace(/"/g, '').trim();
      try {
        const updatedMessage = await Message.findByIdAndUpdate(
          messageId,
          { message },
          { new: true }
        );
    
        const room = `${driverId}_${cleanedCustomerId}`;
        io.to(room).emit('receive_message_driver_client', updatedMessage);
      } catch (err) {
        console.error('Error updating message:', err);
      }
    });

  socket.on('delete_message_res_client', async (data) => {
    const { restaurantId, customerId, messageId } = data;
    console.log(data);
    // Check if messageId is provided
    if (!messageId) {
        console.error('No messageId provided for deletion.');
        return; // Early exit if messageId is not provided
    }

    // Delete the message in the database
    try {
        const deletedMessage = await Message.findByIdAndDelete(messageId);

        // Check if the message was found and deleted
        if (deletedMessage) {
            const room = `${restaurantId}_${customerId}`;
            io.to(room).emit('message_deleted', { messageId }); // Emit an event for deleted message
        } else {
            console.error('Message not found for ID:', messageId);
        }
    } catch (err) {
        console.error('Error deleting message:', err);
    }
});

socket.on('delete_message_driver_client', async (data) => {
  const { driverId, customerId, messageId } = data;

  // Check if messageId is provided
  if (!messageId) {
      console.error('No messageId provided for deletion.');
      return; // Early exit if messageId is not provided
  }

  // Delete the message in the database
  try {
      const deletedMessage = await Message.findByIdAndDelete(messageId);

      // Check if the message was found and deleted
      if (deletedMessage) {
          const room = `${driverId}_${customerId}`;
          io.to(room).emit('message_deleted', { messageId }); // Emit an event for deleted message
      } else {
          console.error('Message not found for ID:', messageId);
      }
  } catch (err) {
      console.error('Error deleting message:', err);
  }
});
socket.on('delete_message_res_driver', async (data) => {
  const { driverId, restaurantId, messageId } = data;

  // Check if messageId is provided
  if (!messageId) {
      console.error('No messageId provided for deletion.');
      return; // Early exit if messageId is not provided
  }

  // Delete the message in the database
  try {
      const deletedMessage = await Message.findByIdAndDelete(messageId);

      // Check if the message was found and deleted
      if (deletedMessage) {
        const room = `${restaurantId}_${driverId}`;
          io.to(room).emit('message_deleted', { messageId }); // Emit an event for deleted message
      } else {
          console.error('Message not found for ID:', messageId);
      }
  } catch (err) {
      console.error('Error deleting message:', err);
  }
});
socket.on('mark_as_read_res_client', async (data) => {
  const { customerId, restaurantId } = data;

  // Lấy danh sách các tin nhắn chưa đọc
  const updatedMessages = await Message.find({
    customerId: customerId,
    restaurantId: restaurantId,
    sender: { $ne: restaurantId },
    isRead: 'unread',
  });

  // Cập nhật tất cả tin nhắn có điều kiện trên thành 'read'
  await Message.updateMany(
    { _id: { $in: updatedMessages.map((msg) => msg._id) } },
    { $set: { isRead: 'read' } }
  );

  const room = `${restaurantId}_${customerId}`;
  const messageIds = updatedMessages.map((msg) => msg._id); // Danh sách các id tin nhắn đã đọc

  // Emit sự kiện để client cập nhật giao diện
  io.to(room).emit('messages_marked_as_read', { restaurantId, messageIds });
});

socket.on('mark_as_read_res_driver', async (data) => {
  const { driverId, restaurantId } = data;

  // Lấy danh sách các tin nhắn chưa đọc
  const updatedMessages = await Message.find({
    driverId: driverId,
    restaurantId: restaurantId,
    sender: { $ne: restaurantId },
    isRead: 'unread',
  });

  // Cập nhật tất cả tin nhắn có điều kiện trên thành 'read'
  await Message.updateMany(
    { _id: { $in: updatedMessages.map((msg) => msg._id) } },
    { $set: { isRead: 'read' } }
  );

  const room = `${restaurantId}_${driverId}`;
  const messageIds = updatedMessages.map((msg) => msg._id); // Danh sách các id tin nhắn đã đọc

  // Emit sự kiện để client cập nhật giao diện
  io.to(room).emit('messages_marked_as_read', { restaurantId, messageIds });
});

socket.on('mark_as_read_driver_res', async (data) => {
  const { driverId, restaurantId } = data;

  // Lấy danh sách các tin nhắn chưa đọc
  const updatedMessages = await Message.find({
    driverId: driverId,
    restaurantId: restaurantId,
    sender: { $ne: driverId },
    isRead: 'unread',
  });

  // Cập nhật tất cả tin nhắn có điều kiện trên thành 'read'
  await Message.updateMany(
    { _id: { $in: updatedMessages.map((msg) => msg._id) } },
    { $set: { isRead: 'read' } }
  );

  const room = `${restaurantId}_${driverId}`;
  const messageIds = updatedMessages.map((msg) => msg._id); // Danh sách các id tin nhắn đã đọc

  // Emit sự kiện để client cập nhật giao diện
  io.to(room).emit('messages_marked_as_read', { driverId, messageIds });
});

socket.on('mark_as_read_cus_driver', async (data) => {
  const { driverId, customerId } = data;

  // Lấy danh sách các tin nhắn chưa đọc
  const updatedMessages = await Message.find({
    driverId: driverId,
    customerId: customerId,
    sender: { $ne: customerId },
    isRead: 'unread',
  });

  // Cập nhật tất cả tin nhắn có điều kiện trên thành 'read'
  await Message.updateMany(
    { _id: { $in: updatedMessages.map((msg) => msg._id) } },
    { $set: { isRead: 'read' } }
  );

  const room = `${driverId}_${customerId}`;
  const messageIds = updatedMessages.map((msg) => msg._id); // Danh sách các id tin nhắn đã đọc

  // Emit sự kiện để client cập nhật giao diện
  io.to(room).emit('messages_marked_as_read', { customerId, messageIds });
});

socket.on('mark_as_read_driver_cus', async (data) => {
  const { driverId, customerId } = data;

  // Lấy danh sách các tin nhắn chưa đọc
  const updatedMessages = await Message.find({
    driverId: driverId,
    customerId: customerId,
    sender: { $ne: driverId },
    isRead: 'unread',
  });

  // Cập nhật tất cả tin nhắn có điều kiện trên thành 'read'
  await Message.updateMany(
    { _id: { $in: updatedMessages.map((msg) => msg._id) } },
    { $set: { isRead: 'read' } }
  );

  const room = `${driverId}_${customerId}`;
  const messageIds = updatedMessages.map((msg) => msg._id); // Danh sách các id tin nhắn đã đọc

  // Emit sự kiện để client cập nhật giao diện
  io.to(room).emit('messages_marked_as_read', { driverId, messageIds });
});

socket.on('mark_as_read_client_res', async (data) => {
  const { customerId, restaurantId } = data;

  // Lấy danh sách các tin nhắn chưa đọc
  const updatedMessages = await Message.find({
    customerId: customerId,
    restaurantId: restaurantId,
    sender: { $ne: customerId },
    isRead: 'unread',
  });

  // Cập nhật tất cả tin nhắn có điều kiện trên thành 'read'
  await Message.updateMany(
    { _id: { $in: updatedMessages.map((msg) => msg._id) } },
    { $set: { isRead: 'read' } }
  );

  const room = `${restaurantId}_${customerId}`;
  const messageIds = updatedMessages.map((msg) => msg._id); // Danh sách các id tin nhắn đã đọc

  // Emit sự kiện để client cập nhật giao diện
  io.to(room).emit('messages_marked_as_read', { customerId, messageIds });
});


    socket.on('join_room_restaurant_client', (data) => {
        const { restaurantId, customerId } = data;
        const room = `${restaurantId}_${customerId}`;
        socket.join(room);
        console.log(`User joined room: ${room}`);
    });

    socket.on('join_room_driver_client', (data) => {
      const { driverId, customerId } = data;
      const room = `${driverId}_${customerId}`;
      socket.join(room);
      console.log(`User joined room: ${room}`);
  });
  socket.on('join_room_restaurant_driver', (data) => {
    const { restaurantId, driverId } = data;
    const room = `${restaurantId}_${driverId}`;
    socket.join(room);
    console.log(`User joined room: ${room}`);
});

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Khởi động Socket.io trên cổng 5000
ioServer.listen(port, () => {
    console.log(`Socket.io server listening on port ${port}`);
});

