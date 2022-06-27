# Audio-Server

> Audio-Server package for the Synology Audio Server project.

## Running the production server

Before starting the setup of the production server, here are a few things you should be aware of:

- Server will be hosted on the Synology NAS.
- Make sure you have an SSH access to the NAS. You will need to use an `administrator` account as only administrators can access SSH (a dumb decision made by Synology). If opening the SSH port, make sure to do **port forwarding** in order to reduce the risk of attacks (:22 > :4123).
- We will run an HTTP Express server for the REST-API.
- We will take care of SSL/HTTPS by using a reverse-proxy included in the Synology NAS on the generated SSL https://my-nas.synology.me that you have already configured on the initial setup.
- Make sure you already have a small MongoDB instance running. I highly recommend you to use a on-demand free instance at https://www.mongodb.com/atlas/database
- Choose a port that you want to expose from your NAS to the outside world, in this example it will be `:3000`.

1. Enable User Home on your NAS:

   1. **Control Panel** > **Advanced** > **User Home**
   2. Tick **Enable user home service** 

2. Update your environment variables with a `.env` file:

  ```shell
  cp .env.example .env
  ```

  A note about directories paths, those should be absolute paths from `/var/services/homes`.

3. Use the built-in reverse-proxy on your Synology NAS to redirect trafic from an outside port to a specific inside port _(eg. outside :3000 to inside: 3001)_:

   1. **Control Panel** > **Login Portal** > **Advanced**
   2. **Reverse Proxy** > **Create**
   3. Source: protocol `HTTPS`, hostname `unset`, port `3000` (feel free to edit the outgoing).
   4. Destination: protocol `HTTP` (Express is an HTTP server), hostname `localhost`, port `3001` (or whatever you put in your `.env`).
   5. **Save** > you're all set!
   6. Test reverse-proxy by accessing https://<my-nas>.synology.me:3000, you should see a Synology page "Sorry, the page you are looking for is not found", meaning it has properly redirected trafic by going inside Synology reverse-proxy.

4. Prepare the server:

   1. Use NodeJS v16 (or latest LTS). Install NodeJS from your Synology dashboard **Package Center**, no special configuration needed.
   2. Run `npm install` to install dependencies.
   3. Run `npm run build` to build the source-code.
   4. Try running the server with `NODE_ENV=production node ./dist/index.js` and access it from https://<my-nas>.synology.me:3000

5. Running the server as a background process:

   1. Install `pm2` globally as sudoer (yes this is bad, thanks Synology, we don't have other choices): `sudo npm install -g pm2`.
   2. Access `pm2` globally with `sudo pm2`.
   3. Create a process with: `sudo pm2 start dist/index.js --name "audio-server" --env production`.
   4. List all processes: `sudo pm2 list`.
   5. Get more details with: `sudo pm2 describe <process-id>`

   Note: this issue may be relevant https://github.com/Unitech/pm2/issues/4272

Congratulations, your audio-server is now ready! 🎉
