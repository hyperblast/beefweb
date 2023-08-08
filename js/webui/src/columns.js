export const Visibility = Object.freeze({
    never: Object.freeze({
        small: false,
        medium: false,
        large: false,
    }),
    always: Object.freeze({
        small: true,
        medium: true,
        large: true
    }),
    mediumAndLarge: Object.freeze({
        small: false,
        medium: true,
        large: true
    }),
    largeOnly: Object.freeze({
        small: false,
        medium: false,
        large: true,
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
    playlistColumn('Album', '%album%', Visibility.mediumAndLarge),
    playlistColumn('Track No', '%track%', Visibility.largeOnly),
    playlistColumn('Title', '%title%', Visibility.always),
    playlistColumn('Duration', '%length%', Visibility.largeOnly),
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
