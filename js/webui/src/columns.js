export const lineBreak = Object.freeze({
    lineBreak: true
});

export const ColumnAlign = Object.freeze({
    left: 'left',
    center: 'center',
    right: 'right'
})

export const playlistColumnDefaults = Object.freeze({
    size: 10,
    small: false,
    bold: false,
    italic: false,
    align: ColumnAlign.left,
});

function playlistColumn(title, expression, opts = null)
{
    return Object.freeze(Object.assign({ title, expression }, playlistColumnDefaults, opts));
}

function column(title, expression, opts = null)
{
    return Object.freeze(Object.assign({ title, expression }, opts));
}

export function getColumnExpressions(columns)
{
    return columns.filter(c => !c.lineBreak).map(c => c.expression);
}

export const playlistColumns = Object.freeze({
    artist: playlistColumn('Artist', '%artist%'),
    album: playlistColumn('Album', '%album%'),
    track: playlistColumn('Track No', '%track%'),
    title: playlistColumn('Title', '%title%'),
    duration: playlistColumn('Duration', '%length%'),
    date: playlistColumn('Date', '%date%'),
});

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
