const {html} = require('htm/react')
class CheckboxButton extends React.Component {
  constructor(props) {
     super(props);
     this.state = {isToggleOn: props.isToggleOn == 'true' || props.isToggleOn == 1 };
     this.handleClick = this.handleClick.bind(this);
  }
  handleClick() {
    this.setState(state => ({
      isToggleOn: !state.isToggleOn
    }));
    this.props.onChange();
  }
  render() {
    return (
      html`<div className=${this.state.isToggleOn ? this.props.on : this.props.off} onClick=${this.handleClick}>✓</div>`
    );
  }
}
module.exports = {
  CheckboxButton
};
