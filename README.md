
# Socket.IO Chat

A simple chat demo for socket.io

## How to use

```
$ cd socket.io
$ npm install
$ cd examples/chat
$ npm install
$ node .
```

And point your browser to `http://localhost:3000`. Optionally, specify
a port by supplying the `PORT` env variable.

## Features

- Multiple users can join a chat room by each entering a unique username
on website load.
- Users can type chat messages to the chat room.
- A notification is sent to all users when a user joins or leaves
the chatroom.

## Openshift
$git remote add openshift ssh://57a368ed2d52710de4000033@altp-oic.rhcloud.com/~/git/altp.git/

#### if have any error, try to log:
 $rhc ssh -a image
 $tail app-root/logs/nodejs.log

#### MongoDb configuration
````
 MongoDB 2.4 database added.  Please make note of these credentials:

   Root User:     admin
   Root Password: ********
   Database Name: image

 Connection URL: mongodb://$OPENSHIFT_MONGODB_DB_HOST:$OPENSHIFT_MONGODB_DB_PORT/
````

#### remote git:
 ssh://5766b0f50c1e6601a800014e@image-oic.rhcloud.com/~/git/image.git/

#### watch using space memory
 $rhc show-app image --gears quota

#### port forwarding (use remote database on local computer)
 $rhc port-forward image
 
#### root directory
 /var/lib/openshift/5766b0f50c1e6601a800014e
 
#### set DEV/PROD mode
 export NODE_ENV=production (or development)