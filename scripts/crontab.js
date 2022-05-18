// "*/5 * * * * *"
// 每5秒執行一次
let BACKUP_TO_REMOTE_MINUTE_INTERVAL = process.env.BACKUP_TO_REMOTE_MINUTE_INTERVAL

if (!BACKUP_TO_REMOTE_MINUTE_INTERVAL) {
	BACKUP_TO_REMOTE_MINUTE_INTERVAL = 30
}

if (Number(BACKUP_TO_REMOTE_MINUTE_INTERVAL) >= 60) {
	BACKUP_TO_REMOTE_MINUTE_INTERVAL = 59
}

// console.log({BACKUP_TO_REMOTE_MINUTE_INTERVAL})

const fs = require('fs')

const sourcePath = '/data_source/'
const targetPath = '/data_backup/'
const archivePath = '/data_archive/'

if (fs.existsSync(sourcePath) === false || 
		fs.existsSync(targetPath) === false) {
	console.log('Backup cron is stopped.')
	process.exit()
}

const ShellExec = require('./lib/ShellExec.js')

var CronJob = require('cron').CronJob;

let cronLock = false
new CronJob(
	`* */${BACKUP_TO_REMOTE_MINUTE_INTERVAL} * * * *`,
	async function() {
		if (cronLock === true) {
			return false
		}
		cronLock = true
		// console.log('Run backup job...')

		await ShellExec(`rsync -avhz ${sourcePath} ${targetPath}`, false)
		//await ShellExec(`cd ${sourcePath}; zip ${targetPath}important-backup.zip *`)
		
		//await ShellExec(`7z a ${targetPath}important-backup.zip @.`)
		// process.chdir(sourcePath)
		// await ShellExec(`zip -9jpr ${targetPath}important-backup.zip *`)
		
		cronLock = false
	},
	null,
	true
)

// ---------------------------

let ARCHIVE_SCHEDULE = process.env.ARCHIVE_SCHEDULE
if (fs.existsSync(archivePath) === false) {
	console.log('Archive cron is stopped.')
	process.exit()
}

// mysql-build-540d75f2
//ARCHIVE_SCHEDULE = 'mysql-build-540d75f2'
if (ARCHIVE_SCHEDULE.split(' ').length !== 6 && 
ARCHIVE_SCHEDULE.split(' ').length !== 5) {
	// 表示不是用標準的cron語法
	let hyperPos = ARCHIVE_SCHEDULE.lastIndexOf('-')
	if (hyperPos !== -1) {
		ARCHIVE_SCHEDULE = ARCHIVE_SCHEDULE.slice(hyperPos + 1)
	}

	ARCHIVE_SCHEDULE = ARCHIVE_SCHEDULE.replace(/[^-.0-9]/g,'')
	ARCHIVE_SCHEDULE = Number(ARCHIVE_SCHEDULE)
	if (isNaN(ARCHIVE_SCHEDULE)) {
		ARCHIVE_SCHEDULE = 0
	}

	let weekOfDay = ARCHIVE_SCHEDULE % 7
	let hour = ARCHIVE_SCHEDULE % 5 + 1	// 只限制在1點到6點之間
	let minute = ARCHIVE_SCHEDULE % 60

	ARCHIVE_SCHEDULE = `0 ${minute} ${hour} * * ${weekOfDay}`

	console.log("ARCHIVE_SCHEDULE is setted as:", ARCHIVE_SCHEDULE)
}



let ARCHIVE_VERSION_LIMIT = process.env.ARCHIVE_VERSION_LIMIT
if (!ARCHIVE_VERSION_LIMIT) {
	ARCHIVE_VERSION_LIMIT = 4
}

function sleep(ms = 500) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

const dayjs = require('dayjs')

var checksum = require('checksum')

let lastChecksum

async function createArchive() {

	let files = fs.readdirSync(targetPath)
	if (files.length === 0) {
		return false
	}

	let dateString = dayjs().format('YYYY_MMDD_HHmmss')
	let filename = `archive-${dateString}.zip`

	//await ShellExec(`7z a ${targetPath}important-backup.zip @.`)
	process.chdir(targetPath)
	//console.log('Workdir is', targetPath)
	await ShellExec(`zip -9jpr /tmp/${filename} *`, false)

	// 檢查checksum
	if (!lastChecksum) {
		lastChecksum = await getLastChecksum()
	}
	let currentChecksum = await getChecksum(`/tmp/${filename}`)
	if (lastChecksum && currentChecksum === lastChecksum) {
		console.log(`Same archive ${filename}`)
		await ShellExec(`rm /tmp/${filename}`, false)
		return false
	}
	lastChecksum = currentChecksum
	await ShellExec(`mv /tmp/${filename} ${archivePath}`, false)
	console.log(`Create archive ${filename}`)
	return true
}

async function getLastChecksum() {
	let files = fs.readdirSync(archivePath)
	if (files.length === 0) {
		return false
	}

	let lastFile = files[(files.length - 1)]

	return await getChecksum(path.join(archivePath, lastFile))
}

async function getChecksum (file) {
	return new Promise((resolve, reject) => {
		checksum.file(file, function (err, sum) {
			if (err) {
				return reject(err)
			}
			return resolve(sum)
		 })
	})
}

const path = require('path')

async function removeExceededArchives() {
	let files = fs.readdirSync(archivePath)
	let exceededCount = files.length - ARCHIVE_VERSION_LIMIT 
	for (let i = 0; i < exceededCount; i++) {
		fs.unlinkSync(path.join(archivePath, files[i]))
		console.log('Remove exceeded archive: ', path.join(archivePath, files[i]))
	}
}

// console.log(ARCHIVE_SCHEDULE)

new CronJob(
	ARCHIVE_SCHEDULE,
	async function() {
		while (cronLock === true) {
			await sleep()
		}
		cronLock = true
		console.log('Run archive job...')
		if (await createArchive()) {
			await removeExceededArchives()
		}
		
		cronLock = false
	},
	null,
	true
)