// "*/5 * * * * *"
// 每5秒執行一次
let BACKUP_TO_REMOTE_MINUTE_INTERVAL = process.env.BACKUP_TO_REMOTE_MINUTE_INTERVAL

if (!BACKUP_TO_REMOTE_MINUTE_INTERVAL) {
	BACKUP_TO_REMOTE_MINUTE_INTERVAL = 30
}

if (Number(BACKUP_TO_REMOTE_MINUTE_INTERVAL) >= 60) {
	BACKUP_TO_REMOTE_MINUTE_INTERVAL = 59
}

const fs = require('fs')

const sourcePath = '/data_source/'
const targetPath = '/data_backup/'
const archivePath = '/data_archive/'

if (fs.existsSync(sourcePath) === false || 
		fs.existsSync(targetPath) === false) {
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
		console.log('Run backup job...')

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

const ARCHIVE_SCHEDULE = process.env.ARCHIVE_SCHEDULE
if (fs.existsSync(archivePath) === false || !ARCHIVE_SCHEDULE) {
	process.exit()
}

let ARCHIVE_VERSION_LIMIT = process.env.ARCHIVE_VERSION_LIMIT
if (!ARCHIVE_VERSION_LIMIT) {
	ARCHIVE_VERSION_LIMIT = 4
}

function sleep(ms = 500) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

const dayjs = require('dayjs')

async function createArchive() {

	let dateString = dayjs().format('YYYY_MMDD_HHmm')
	let filename = `archive-${dateString}.zip`

	//await ShellExec(`7z a ${targetPath}important-backup.zip @.`)
	process.chdir(targetPath)
	await ShellExec(`zip -9jpr /tmp/${filename} *`)
	await ShellExec(`mv /tmp/${filename} ${archivePath}`)
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

new CronJob(
	ARCHIVE_SCHEDULE,
	async function() {
		while (cronLock === true) {
			await sleep()
		}
		cronLock = true
		console.log('Run archive job...')
		await createArchive()
		await removeExceededArchives()
		
		cronLock = false
	},
	null,
	true
)