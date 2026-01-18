import './artwork_api_tests.js';
import './authentication_tests.js';
import './browser_api_tests.js';
import './client_config_api_tests.js'
import './http_features_tests.js';
import './outputs_api_tests.js';
import './permissions_tests.js';
import './player_api_tests.js';
import './playlists_api_tests.js';
import './play_queue_api_tests.js'
import './query_api_tests.js';
import './static_files_tests.js';
import qunit from 'qunit'

const maxFailedTests = 10;
let failedTests = 0;

qunit.on('testEnd', event => {
    if (event.status !== 'failed')
        return;

    if (++failedTests < maxFailedTests)
        return;

    console.error('Too many test failures, stopping');
    QUnit.config.queue.length = 0;
});
