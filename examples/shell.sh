dokku apps:create radarr
dokku config:set --no-restart radarr PUID=1000 PGID=1000 TZ="America/Los Angeles" UMASK_SET=002

mkdir -p /var/lib/dokku/data/storage/radarr/config
chown -R dokku:dokku /var/lib/dokku/data/storage/radarr
mkdir -p /mnt/bucket/downloads
dokku storage:mount radarr /var/lib/dokku/data/storage/radarr/config:/config
dokku storage:mount radarr /mnt/bucket/Plex:/movies
dokku storage:mount radarr /mnt/bucket/downloads:/downloads

docker pull linuxserver/radarr
docker tag linuxserver/radarr dokku/radarr:latest
dokku tags:deploy radarr latest
dokku proxy:ports-add radarr http:80:7878

usermod -a -G storage dokku