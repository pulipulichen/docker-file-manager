#echo 1212
cp -f /filebrowser.db.clone /filebrowser.db
filebrowser config init
#cat /config/config.json
filebrowser users add $FM_USERNAME $FM_PASSWORD
echo "USERNAME is setted as: $FM_USERNAME"

# 如果有資料夾，那就檢查有沒有對應的壓縮檔案
for dirname in /data/*; do
  chmod 777 $dirname
  # 已經有檔案就跳過
  #if [ -z "$(ls $dirname)" ]; then
  #  continue
  #fi
  
  filename="$(basename $dirname)"
  zipfile="/docker-entrypoint-init/${filename}.zip"
  if test -f "/docker-entrypoint-init/${filename}.zip"; then
    unzip $zipfile -d $dirname
    echo "Restore: /docker-entrypoint-init/${filename}.zip"
  fi
done

PORT=80
if [ $FM_PORT ]; then
  PORT=$FM_PORT
fi

# npm i cron
#node /config/crontab.js &
# ls /config
# cat /config/package.json

# 開始執行
filebrowser -c /config/config.json -r /data