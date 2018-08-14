import React from 'react'
import ReactModal from 'react-modal'
import PropTypes from 'prop-types'
import { bindHandlers } from './utils'

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
            { dialogTitles[type] }
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

        bindHandlers(this);
    }

    handleChange(e)
    {
        this.props.onUpdate(e.target.value);
    }

    render()
    {
        const { isOpen, message, value, onOk, onCancel } = this.props;

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
                        <DialogButton type='ok' onClick={onOk} />
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
    value: PropTypes.string.isRequired,
    onUpdate: PropTypes.func.isRequired,
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
};