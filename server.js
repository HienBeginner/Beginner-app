const {createServer} = require('http')
const {Server } = require('socket.io')

const httpServer = new createServer()

const users = {}
const rooms = {}
const io = new Server(httpServer,{
    cors:{
        origin:['http://localhost:8080']
    }
})
io.on('connection',socket=>{
    users[socket.id]=''
    socket.on('name',name=>{
        users[socket.id]=name
    })
    socket.on('check-id',id=>{
        if(!(id in users)) {
            io.to(socket.id).emit('no-id',id)
        }
        else {
            io.to(socket.id).emit('foundID',id)
        }
    })
    socket.on('send-message',(message,room)=>{
        socket.to(room).emit('receive-message',{message:message,name:users[socket.id]})
    })
    socket.on('join-room',roomID=>{
        let event = ''
        if(!checkRoomID(roomID)) {
            event= 'invalid-room'
        }
        else {
            event = 'valid-room'
            socket.join(roomID)
            rooms[roomID]++
            io.to(roomID).emit('update-online-users',rooms[roomID])
            socket.to(roomID).emit('send-notifi-users',users[socket.id]+' joined in the conversation')
        }
        io.to(socket.id).emit(event,roomID)
    })
    socket.on('create-room',roomID=>{
        let event =''
        if(checkRoomID(roomID)) {
            event = 'room-exist'
        }
        else {
            event = 'room-available'
            socket.join(roomID)
            rooms[roomID] =1
        }
        io.to(socket.id).emit(event,roomID)

    })
    socket.on('leave-room',roomID=>{
        socket.leave(roomID)
        rooms[roomID]--
        if(rooms[roomID]==0) delete rooms[roomID]
        io.emit('update-online-users',rooms[roomID])
        socket.to(roomID).emit('send-notifi-users',users[socket.id]+' left')
    })
})
function checkRoomID(roomID) {
    return roomID in rooms
}
httpServer.listen(3000)