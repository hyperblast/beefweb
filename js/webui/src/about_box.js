import React from 'react'
import ServiceContext from './service_context.js';
import ModelBinding from './model_binding.js';

class AboutBox_ extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        this.state = this.getStateFromModel();
    }

    getStateFromModel()
    {
        const { title, version, pluginVersion } = this.context.playerModel.info;
        return { title, version, pluginVersion };
    }

    render()
    {
        const { title, version, pluginVersion } = this.state;

        return (
            <div className='about-box'>
                <p>
                    Beefweb v{pluginVersion} @ {title} v{version}
                </p>
                <p>
                    <a href='https://hyperblast.org/donate/' className='about-box-link' target='_blank'>Donate to author</a>
                    <a href='third-party-licenses.txt' className='about-box-link' target='_blank'>Third-party licenses</a>
                    <a href='https://hyperblast.org/beefweb/api/' className='about-box-link' target='_blank'>API documentation</a>
                </p>
                <p className='license-text'>
                    Copyright 2015-2024 Hyperblast<br/><br/>

                    Permission is hereby granted, free of charge, to any person obtaining a copy
                    of this software and associated documentation files (the "Software"), to deal
                    in the Software without restriction, including without limitation the rights
                    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                    copies of the Software, and to permit persons to whom the Software is
                    furnished to do so, subject to the following conditions:<br/><br/>

                    The above copyright notice and this permission notice shall be included in
                    all copies or substantial portions of the Software.<br/><br/>

                    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
                    THE SOFTWARE.
                </p>
            </div>
        );
    }
}

export default ModelBinding(AboutBox_, { playerModel: 'change'});