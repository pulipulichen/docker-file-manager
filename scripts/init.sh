#echo 1212
cp -f /filebrowser.db.clone /filebrowser.db
filebrowser config init
cat /config/config.json
filebrowser users add $FB_USERNAME $FB_PASSWORD
filebrowser -c /config/config.json -r /data