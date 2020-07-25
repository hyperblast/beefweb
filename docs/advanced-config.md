# Advanced configuration

Advanced configuration is performed by editing configuration file.

The following configuration sources are considered when loading configuration (in the order of increase of preference):

- Settings in UI
- `beefweb.config.json` in the directory where `foo_beefweb.dll`/`beefweb.so` is located
- For foobar2000: `%APPDATA%\beefweb\foobar2000\beefweb.config.json`
- For DeaDBeeF: `$XDG_CONFIG_HOME/beefweb/deadbeef/beefweb.config.json` or `$HOME/.config/beefweb/deadbeef/beefweb.config.json`
- File specified by `BEEFWEB_CONFIG_FILE` environment variable

If setting is specified in more preferred source it overrides values defined in less preferred.

The following options are available:

```js
{
    "port": 8880,
    "allowRemote": true,
    "musicDirs": [],
    "authRequired": false,
    "authUser: "",
    "authPassword": "",
    "webRoot": "{directory of beefweb binary}/beefweb.root",
    "urlMappings": {},
    "responseHeaders": {}
}
```

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

`webRoot: string` - Root directory where static web content is located. This path has to be absolute.

`urlMappings: {string: string}` - Alternative web directories defined by URL prefix

The following configuration file uses `C:\MyWebPage` directory to serve requests starting with `/mywebpage`:

```js
{
    "urlMappings": {
        "/mywebpage: "C:\\MyWebPage"
    }
}
```


`responseHeaders: {string: string}` - Any response headers to send to client. Could be used to enable CORS.

The following configuration file allows to make requests from any origin:

```js
{
    "responseHeaders": {
        "Access-Control-Allow-Origin": "*"
    }
}
```

Please read [documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) to find out how to set up CORS headers properly.
