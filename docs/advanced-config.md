# Advanced configuration

## Profile directory

Beefweb keeps all settings in `{player_profile_dir}/beefweb/` directory:
- foobar2000 on Windows: `%APPDATA%\foobar2000-v2\beefweb\`
- foobar2000 on macOS: `$HOME/Library/foobar2000-v2/beefweb/`
- DeaDBeeF on Linux/*BSD: `$XDG_CONFIG_HOME/deadbeef/beefweb/` (or `$HOME/.config/deadbeef/beefweb/`)
- DeaDBeeF on macOS: `$HOME/Library/Preferences/deadbeef/beefweb/`

### Overriding profile directory

If environment variable `BEEFWEB_PROFILE_DIR` is specified, it overrides default beefweb profile directory.

This path must be absolute.

### Serving custom web content

It is possible to serve custom web content (e.g. custom UI) using built-in web server.

If certain file does not exist in bundled web resources corresponding file inside `{beefweb_profile_dir}/webroot/` will be used. 

## Configuration file

Advanced configuration is performed by editing configuration file stored in `{beefweb_profile_dir}/config.json`.

If setting is specified in configuration file, it overrides setting in UI.

All values are optional, you can specify only those you want to override.

The following options are available:

```json
{
    "port": 8880,
    "allowRemote": true,
    "musicDirs": [],
    "authRequired": false,
    "authUser": "",
    "authPassword": "",
    "webRoot": "{beefweb_binary_dir}/beefweb.root/",
    "altWebRoot": "{beefweb_profile_dir}/webroot/",
    "urlMappings": {},
    "responseHeaders": {},
    "clientConfigDir": "{beefweb_profile_dir}/clientconfig/"
}
```

### Non-absolute paths

Non-absolute paths in configuration file are resolved relative to Beefweb profile directory.

### Network settings

`port: number` - Network port to use (same as in UI)

`allowRemote: bool` - Allow connections from remote hosts (same as in UI)

### Music directories

`musicDirs: [string]` - Music directories to present to clients (same as in UI)

### Authentication settings

`authRequired: bool` - Require authentication (same as in UI)

`authUser: string` - User name for authentication (same as in UI)

`authPassword: string` - Password for authentication (same as in UI)

### Web server settings

`webRoot: string` - Root directory where static web content is located.

`altWebRoot: string` - Alternative web root directory, if file is not found in `webRoot` corresponding file in `altWebRoot` is also tried.

`urlMappings: {string: string}` - Alternative web directories defined by URL prefix

The following configuration file uses `C:\MyWebPage` directory to serve requests starting with `/mywebpage`:

```json
{
    "urlMappings": {
        "/mywebpage": "C:\\MyWebPage"
    }
}
```

`responseHeaders: {string: string}` - Any response headers to send to client. Could be used to enable CORS.

The following configuration file allows to make requests from any origin:

```json
{
    "responseHeaders": {
        "Access-Control-Allow-Origin": "*"
    }
}
```

Please read [documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) to find out how to set up CORS headers properly.

### Other settings

`clientConfigDir: string` - Path to directory where client configuration is stored.
