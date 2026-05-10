import Input from "../input/input";
import SelectField from "../input/select";
import Textarea from "../input/textarea";
import Dropzone from "../input/dropzone";

// interface IFormikControlProps {
//   control: "input" | "textarea" | "select" | "radio" | "checkbox" | "date" | "dropzone";
//   [key: string]: any;
// }
//will implement the other forms of input  like radio, select soon

const FormikControl = (props) => {
  const { control, ...rest } = props;
  switch (control) {
    case "input":
      return <Input {...rest} />;
    case "select":
      return <SelectField {...rest} />;
    case "textarea":
      return <Textarea {...rest} />;
    case "dropzone":
      return <Dropzone {...rest} />;
    default:
      return null;
  }
};

export default FormikControl;