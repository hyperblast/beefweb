# Advanced configuration

Advanced configuration is performed by editing configuration file.

The following configuration sources are considered when loading configuration (in the order of increase of preference):

* Settings in UI
* `{player_profile_dir}/beefweb/config.json`
  - For foobar2000: `%APPDATA%\foobar2000-v2\beefweb\config.json`
  - For DeaDBeeF: `$XDG_CONFIG_HOME/deadbeef/beefweb/config.json` or `$HOME/.config/deadbeef/beefweb/config.json`
* File specified by `BEEFWEB_CONFIG_FILE` environment variable (must be absolute)

If setting is specified in more preferred source it overrides values defined in less preferred.

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
    "webRoot": "{directory of beefweb .dll or .so}/beefweb.root",
    "urlMappings": {},
    "responseHeaders": {},
    "clientConfigDir": "{player profile directory}/beefweb/clientconfig"
}
```

### Non-absolute paths

Unless specified otherwise any path in configuration could be non-absolute.

Such paths are resolved relative to `{player_profile_dir}/beefweb` directory.

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
