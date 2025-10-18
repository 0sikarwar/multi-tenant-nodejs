/*
* This example is for Node.js version ( 14.6 or later versions )
* 
* Follow driver installation and setup instructions here: 
* https://www.oracle.com/database/technologies/appdev/quickstartnodejs.html
*/

const oracledb = require('oracledb');
// If THICK mode is needed, uncomment the following line.

// If you want to connect using your wallet, uncomment the following line.
process.env.TNS_ADMIN = "./wallet";
const libDir =
     process.env["HOME"] + "/instantclient";
    oracledb.initOracleClient({
      libDir,
    });
async function runApp()
{
	console.log("executing runApp");
	// Replace USER_NAME, PASSWORD with your username and password
	const user = "ADMIN";
	const password = "Tci_DB_Password1";
	// If you want to connect using your wallet, comment the following line.
	const connectString = '(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.ap-mumbai-1.oraclecloud.com))(connect_data=(service_name=mv4cxmbf8dmzq19_authdb_high.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))';
	/*
	* If you want to connect using your wallet, uncomment the following line.
	* dbname - is the TNS alias present in tnsnames.ora dbname
	*/
	// const connectString ="authdb_high";
	let connection;
	try {
		connection = await oracledb.getConnection({
			user,
			password,
			connectString,
			// If you want to connect using your wallet, uncomment the following lines.
			configDir: "./wallet",
			walletLocation: "./wallet",
			walletPassword: password
		});
		console.log("Successfully connected to Oracle Databas");
		const result = await connection.execute("select * from dual");
		console.log("Query rows", result.rows);
	} catch (err) {
		console.error(err);
	} finally {
		 if (connection){
			try {
				await connection.close();
			} catch (err) {
				console.error(err);
			}
		}
	}
}

runApp();