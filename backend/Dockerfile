FROM oven/bun:1

WORKDIR /app

COPY package.json ./
COPY bun.lockb* ./

RUN bun install
RUN bun add -d nodemon

# Don't COPY source code - it will be mounted via volume

EXPOSE 5000

CMD ["bun", "run", "dev"]