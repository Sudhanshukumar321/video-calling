const {Server} = require('socket.io');

const io = new Server(8000,{
    cors:true,
});

// to save a track of which email id id is joined in which room
const emailToSocketMap = new Map();

const socketToEmailMap = new Map();

// listening for a connection (jb bhi koi new connecion hoga tb console wala data show kra do)
io.on('connection',(socket)=>{
    console.log('Socket Connected at: ',socket.id);

    // jb bhi frontend se room:join wala event aaye to ye krana hao
    socket.on('room:join',(data) => {
        // console.log(data);
        const {email,room} = data;
        emailToSocketMap.set(email,socket.id);
        socketToEmailMap.set(socket.id,email);
        // ye message existing user(jo phle se join hai) ke liye hai, because unko bhi to pta chale ki koi new user
        // join kr rha hai
        io.to(room).emit('user:joined',{email,id: socket.id});
        // pushing user to that room
        socket.join(room);
        // jb bhi koi user join krega usko ye message milega
        io.to(socket.id).emit('room:join',data);
    });

    socket.on('user:call',({to,offer})=>{
        io.to(to).emit('incomming:call',{from:socket.id,offer});
    });

    socket.on('call:accepted',({to,ans})=>{
        io.to(to).emit('call:accepted',{from:socket.id,ans});
    })
    socket.on('peer:nego:needed',({to,offer})=>{
        io.to(to).emit('peer:nego:needed',{from:socket.id,offer});
    })
    socket.on('peer:nego:done',({to,ans})=>{
        io.to(to).emit('peer:nego:final',{from:socket.id,ans});
    })
});

