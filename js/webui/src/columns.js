import { MediaSize } from './settings_model';

export const Visibility = Object.freeze({
    never: Object.freeze({
        [MediaSize.small]: false,
        [MediaSize.medium]: false,
        [MediaSize.large]: false,
    }),
    always: Object.freeze({
        [MediaSize.small]: true,
        [MediaSize.medium]: true,
        [MediaSize.large]: true
    }),
    largeOnly: Object.freeze({
        [MediaSize.small]: false,
        [MediaSize.medium]: false,
        [MediaSize.large]: true,
    })
});

const defaultOptions = Object.freeze({
    size: 10,
});

function playlistColumn(title, expression, visibility = null, opts = null)
{
    if (visibility === null)
        visibility = Visibility.never;
    else
        visibility = Object.freeze(Object.assign({}, Visibility.never, visibility));

    const column = {
        title,
        expression,
        visibility
    };

    return Object.freeze(Object.assign(column, defaultOptions, opts));
}

function column(title, expression, opts = null)
{
    return Object.freeze(Object.assign({ title, expression }, opts));
}

export const allColumns = [
    playlistColumn('Artist', '%artist%', Visibility.always),
    playlistColumn('Album', '%album%', Visibility.largeOnly),
    playlistColumn('Track No', '%track%', Visibility.largeOnly),
    playlistColumn('Title', '%title%', Visibility.always),
    playlistColumn('Duration', '%duration%', Visibility.largeOnly),
    playlistColumn('Date', '%date%', Visibility.never),
];

export const sortMenuColumns = [
    column('Artist', '%artist%'),
    column('Album', '%album%'),
    column('Track number', '%track%'),
    column('Date', '%date%'),
    column('Title', '%title%'),
    column('Random', '', { random: true })
];

export const navigationMenuColumns = [
    column('Artist', '%artist%'),
    column('Album', '%album%'),
];

export const defaultPlaylistColumns = allColumns.filter(
    c => c.visibility.small || c.visibility.medium || c.visibility.large);
