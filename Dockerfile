FROM node:12

COPY package.json .
COPY yarn.lock .
RUN yarn
COPY . .
ENV NODE_ENV=production
RUN NODE_ENV=production yarn build
ENTRYPOINT [ "node","/dist/src/index.js" ]
