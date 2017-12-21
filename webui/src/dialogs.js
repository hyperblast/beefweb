import React from 'react'
import ReactModal from 'react-modal'
import PropTypes from 'prop-types'

const dialogTitles = Object.freeze({
    ok: 'OK',
    cancel: 'Cancel'
});

export function DialogButton(props)
{
    const { type, onClick } = props;

    return (
        <button
            className={'dialog-button dialog-button-' + type}
            onClick={onClick}>
            {dialogTitles[type]}
        </button>
    );
}

DialogButton.propTypes = {
    type: PropTypes.oneOf(['ok', 'cancel']).isRequired,
    onClick: PropTypes.func,
};

export function ConfirmDialog(props)
{
    const { isOpen, message, onOk, onCancel } = props;

    return (
        <ReactModal
            isOpen={isOpen}
            onRequestClose={onCancel}
            className='dialog dialog-confirm'
            overlayClassName='dialog-overlay'
            ariaHideApp={false}>
            <form className='dialog-content'>
                <div className='dialog-body'>
                    <span className='dialog-confirm-message'>{message}</span>
                </div>
                <div className='dialog-buttons'>
                    <DialogButton type='ok' onClick={onOk} />
                    <DialogButton type='cancel' onClick={onCancel} />
                </div>
            </form>
        </ReactModal>
    );
}

ConfirmDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    message: PropTypes.string.isRequired,
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
};

export class InputDialog extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = { value: this.props.initialValue };
        this.handleChange = this.handleChange.bind(this);
        this.handleOkClick = this.handleOkClick.bind(this);
    }

    handleChange(e)
    {
        this.setState({ value: e.target.value });
    }

    handleOkClick()
    {
        if (this.props.onOk)
            this.props.onOk(this.state.value);
    }

    render()
    {
        const { isOpen, message, onCancel } = this.props;
        const { value } = this.state;

        return (
            <ReactModal
                isOpen={isOpen}
                onRequestClose={onCancel}
                className='dialog dialog-input'
                overlayClassName='dialog-overlay'
                ariaHideApp={false}>
                <form className='dialog-content'>
                    <div className='dialog-body'>
                        <label>
                            <span className='dialog-input-message'>{message}</span>
                            <input type='text' value={value} onChange={this.handleChange} />
                        </label>
                    </div>
                    <div className='dialog-buttons'>
                        <DialogButton type='ok' onClick={this.handleOkClick} />
                        <DialogButton type='cancel' onClick={onCancel} />
                    </div>
                </form>
            </ReactModal>
        );
    }
}

InputDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    message: PropTypes.string.isRequired,
    initialValue: PropTypes.string,
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
};

InputDialog.defaultProps = {
    initialValue: ''
};