'use strict';

const JustGage = require('justgage');
const { v4: uuidv4 } = require('uuid');
const { html } = require('htm/react');

class Gauge extends React.Component {
  constructor() {
    super();
    this.id = uuidv4();
  }
  componentDidMount() {
    this.node = ReactDOM.findDOMNode( this );

    this.guage = new JustGage({
      id: this.id,
      value: parseFloat( this.props.value ),
      min: parseFloat( this.props.min ),
      max: parseFloat( this.props.max ),
      title: this.props.title,
      label: this.props.label,
      symbol: this.props.symbol,
      gaugeColor: this.props.gaugeColor,
      decimals: parseInt(this.props.decimals),
      levelColors: [this.props.levelColor],
      relativeGaugeSize: true
    });
  }
  componentDidUpdate( prevProps ) {
    let nextProps = this.props;
    if ( nextProps.value !== prevProps.value ) {
      this.guage.refresh( nextProps.value );
    }
    if ( nextProps.max !== prevProps.max ) {
      this.guage.refresh( nextProps.value, nextProps.max );
    }
  }
  componentWillUnmount() {
    ReactDOM.unmountComponentAtNode( this.node );
  }
  render() {
    return (
      html`<div id=${this.id}/>`
    );
  }
}

module.exports = {
  Gauge
};