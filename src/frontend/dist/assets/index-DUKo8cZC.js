import { V as Visitor, P as Principal } from "./index-CdDWet4b.js";
import { I, h, j, g, i, b, l, f, r, s, a, d, c, k, u, m, e, w } from "./index-CdDWet4b.js";
class InputBox {
  constructor(idl, ui) {
    this.idl = idl;
    this.ui = ui;
    this.label = null;
    this.value = void 0;
    const status = document.createElement("span");
    status.className = "status";
    this.status = status;
    if (ui.input) {
      ui.input.addEventListener("blur", () => {
        if (ui.input.value === "") {
          return;
        }
        this.parse();
      });
      ui.input.addEventListener("input", () => {
        status.style.display = "none";
        ui.input.classList.remove("reject");
      });
    }
  }
  isRejected() {
    return this.value === void 0;
  }
  parse(config = {}) {
    if (this.ui.form) {
      const value = this.ui.form.parse(config);
      this.value = value;
      return value;
    }
    if (this.ui.input) {
      const input = this.ui.input;
      try {
        const value = this.ui.parse(this.idl, config, input.value);
        if (!this.idl.covariant(value)) {
          throw new Error(`${input.value} is not of type ${this.idl.display()}`);
        }
        this.status.style.display = "none";
        this.value = value;
        return value;
      } catch (err) {
        input.classList.add("reject");
        this.status.style.display = "block";
        this.status.innerHTML = "InputError: " + err.message;
        this.value = void 0;
        return void 0;
      }
    }
    return null;
  }
  render(dom) {
    const container = document.createElement("span");
    if (this.label) {
      const label = document.createElement("label");
      label.innerText = this.label;
      container.appendChild(label);
    }
    if (this.ui.input) {
      container.appendChild(this.ui.input);
      container.appendChild(this.status);
    }
    if (this.ui.form) {
      this.ui.form.render(container);
    }
    dom.appendChild(container);
  }
}
class InputForm {
  constructor(ui) {
    this.ui = ui;
    this.form = [];
  }
  renderForm(dom) {
    if (this.ui.container) {
      this.form.forEach((e2) => e2.render(this.ui.container));
      dom.appendChild(this.ui.container);
    } else {
      this.form.forEach((e2) => e2.render(dom));
    }
  }
  render(dom) {
    if (this.ui.open && this.ui.event) {
      dom.appendChild(this.ui.open);
      const form = this;
      form.ui.open.addEventListener(form.ui.event, () => {
        if (form.ui.container) {
          form.ui.container.innerHTML = "";
        } else {
          const oldContainer = form.ui.open.nextElementSibling;
          if (oldContainer) {
            oldContainer.parentNode.removeChild(oldContainer);
          }
        }
        form.generateForm();
        form.renderForm(dom);
      });
    } else {
      this.generateForm();
      this.renderForm(dom);
    }
  }
}
class RecordForm extends InputForm {
  constructor(fields, ui) {
    super(ui);
    this.fields = fields;
    this.ui = ui;
  }
  generateForm() {
    this.form = this.fields.map(([key, type]) => {
      const input = this.ui.render(type);
      if (this.ui.labelMap && this.ui.labelMap.hasOwnProperty(key)) {
        input.label = this.ui.labelMap[key] + " ";
      } else {
        input.label = key + " ";
      }
      return input;
    });
  }
  parse(config) {
    const v = {};
    this.fields.forEach(([key, _], i2) => {
      const value = this.form[i2].parse(config);
      v[key] = value;
    });
    if (this.form.some((input) => input.isRejected())) {
      return void 0;
    }
    return v;
  }
}
class TupleForm extends InputForm {
  constructor(components, ui) {
    super(ui);
    this.components = components;
    this.ui = ui;
  }
  generateForm() {
    this.form = this.components.map((type) => {
      const input = this.ui.render(type);
      return input;
    });
  }
  parse(config) {
    const v = [];
    this.components.forEach((_, i2) => {
      const value = this.form[i2].parse(config);
      v.push(value);
    });
    if (this.form.some((input) => input.isRejected())) {
      return void 0;
    }
    return v;
  }
}
class VariantForm extends InputForm {
  constructor(fields, ui) {
    super(ui);
    this.fields = fields;
    this.ui = ui;
  }
  generateForm() {
    const index = this.ui.open.selectedIndex;
    const [_, type] = this.fields[index];
    const variant = this.ui.render(type);
    this.form = [variant];
  }
  parse(config) {
    const select = this.ui.open;
    const selected = select.options[select.selectedIndex].value;
    const value = this.form[0].parse(config);
    if (value === void 0) {
      return void 0;
    }
    const v = {};
    v[selected] = value;
    return v;
  }
}
class OptionForm extends InputForm {
  constructor(ty, ui) {
    super(ui);
    this.ty = ty;
    this.ui = ui;
  }
  generateForm() {
    if (this.ui.open.checked) {
      const opt = this.ui.render(this.ty);
      this.form = [opt];
    } else {
      this.form = [];
    }
  }
  parse(config) {
    if (this.form.length === 0) {
      return [];
    } else {
      const value = this.form[0].parse(config);
      if (value === void 0) {
        return void 0;
      }
      return [value];
    }
  }
}
class VecForm extends InputForm {
  constructor(ty, ui) {
    super(ui);
    this.ty = ty;
    this.ui = ui;
  }
  generateForm() {
    const len = +this.ui.open.value;
    this.form = [];
    for (let i2 = 0; i2 < len; i2++) {
      const t = this.ui.render(this.ty);
      this.form.push(t);
    }
  }
  parse(config) {
    const value = this.form.map((input) => {
      return input.parse(config);
    });
    if (this.form.some((input) => input.isRejected())) {
      return void 0;
    }
    return value;
  }
}
const InputConfig = { parse: parsePrimitive };
const FormConfig = { render: renderInput };
const inputBox = (t, config) => {
  return new InputBox(t, { ...InputConfig, ...config });
};
const recordForm = (fields, config) => {
  return new RecordForm(fields, { ...FormConfig, ...config });
};
const tupleForm = (components, config) => {
  return new TupleForm(components, { ...FormConfig, ...config });
};
const variantForm = (fields, config) => {
  return new VariantForm(fields, { ...FormConfig, ...config });
};
const optForm = (ty, config) => {
  return new OptionForm(ty, { ...FormConfig, ...config });
};
const vecForm = (ty, config) => {
  return new VecForm(ty, { ...FormConfig, ...config });
};
class Render extends Visitor {
  visitType(t, _d) {
    const input = document.createElement("input");
    input.classList.add("argument");
    input.placeholder = t.display();
    return inputBox(t, { input });
  }
  visitNull(t, _d) {
    return inputBox(t, {});
  }
  visitRecord(t, fields, _d) {
    let config = {};
    if (fields.length > 1) {
      const container = document.createElement("div");
      container.classList.add("popup-form");
      config = { container };
    }
    const form = recordForm(fields, config);
    return inputBox(t, { form });
  }
  visitTuple(t, components, _d) {
    let config = {};
    if (components.length > 1) {
      const container = document.createElement("div");
      container.classList.add("popup-form");
      config = { container };
    }
    const form = tupleForm(components, config);
    return inputBox(t, { form });
  }
  visitVariant(t, fields, _d) {
    const select = document.createElement("select");
    for (const [key, _type] of fields) {
      const option = new Option(key);
      select.add(option);
    }
    select.selectedIndex = -1;
    select.classList.add("open");
    const config = { open: select, event: "change" };
    const form = variantForm(fields, config);
    return inputBox(t, { form });
  }
  visitOpt(t, ty, _d) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("open");
    const form = optForm(ty, { open: checkbox, event: "change" });
    return inputBox(t, { form });
  }
  visitVec(t, ty, _d) {
    const len = document.createElement("input");
    len.type = "number";
    len.min = "0";
    len.max = "100";
    len.style.width = "8rem";
    len.placeholder = "len";
    len.classList.add("open");
    const container = document.createElement("div");
    container.classList.add("popup-form");
    const form = vecForm(ty, { open: len, event: "change", container });
    return inputBox(t, { form });
  }
  visitRec(_t, ty, _d) {
    return renderInput(ty);
  }
}
class Parse extends Visitor {
  visitNull(_t, _v) {
    return null;
  }
  visitBool(_t, v) {
    if (v === "true") {
      return true;
    }
    if (v === "false") {
      return false;
    }
    throw new Error(`Cannot parse ${v} as boolean`);
  }
  visitText(_t, v) {
    return v;
  }
  visitFloat(_t, v) {
    return parseFloat(v);
  }
  visitFixedInt(t, v) {
    if (t._bits <= 32) {
      return parseInt(v, 10);
    } else {
      return BigInt(v);
    }
  }
  visitFixedNat(t, v) {
    if (t._bits <= 32) {
      return parseInt(v, 10);
    } else {
      return BigInt(v);
    }
  }
  visitNumber(_t, v) {
    return BigInt(v);
  }
  visitPrincipal(_t, v) {
    return Principal.fromText(v);
  }
  visitService(_t, v) {
    return Principal.fromText(v);
  }
  visitFunc(_t, v) {
    const x = v.split(".", 2);
    return [Principal.fromText(x[0]), x[1]];
  }
}
class Random extends Visitor {
  visitNull(_t, _v) {
    return null;
  }
  visitBool(_t, _v) {
    return Math.random() < 0.5;
  }
  visitText(_t, _v) {
    return Math.random().toString(36).substring(6);
  }
  visitFloat(_t, _v) {
    return Math.random();
  }
  visitInt(_t, _v) {
    return BigInt(this.generateNumber(true));
  }
  visitNat(_t, _v) {
    return BigInt(this.generateNumber(false));
  }
  visitFixedInt(t, v) {
    const x = this.generateNumber(true);
    if (t._bits <= 32) {
      return x;
    } else {
      return BigInt(v);
    }
  }
  visitFixedNat(t, v) {
    const x = this.generateNumber(false);
    if (t._bits <= 32) {
      return x;
    } else {
      return BigInt(v);
    }
  }
  generateNumber(signed) {
    const num = Math.floor(Math.random() * 100);
    if (signed && Math.random() < 0.5) {
      return -num;
    } else {
      return num;
    }
  }
}
function parsePrimitive(t, config, d2) {
  if (config.random && d2 === "") {
    return t.accept(new Random(), d2);
  } else {
    return t.accept(new Parse(), d2);
  }
}
function renderInput(t) {
  return t.accept(new Render(), null);
}
function renderValue(t, input, value) {
  return t.accept(new RenderValue(), { input, value });
}
class RenderValue extends Visitor {
  visitType(t, d2) {
    d2.input.ui.input.value = t.valueToString(d2.value);
  }
  visitNull(_t, _d) {
  }
  visitText(_t, d2) {
    d2.input.ui.input.value = d2.value;
  }
  visitRec(_t, ty, d2) {
    renderValue(ty, d2.input, d2.value);
  }
  visitOpt(_t, ty, d2) {
    if (d2.value.length === 0) {
      return;
    } else {
      const form = d2.input.ui.form;
      const open = form.ui.open;
      open.checked = true;
      open.dispatchEvent(new Event(form.ui.event));
      renderValue(ty, form.form[0], d2.value[0]);
    }
  }
  visitRecord(_t, fields, d2) {
    const form = d2.input.ui.form;
    fields.forEach(([key, type], i2) => {
      renderValue(type, form.form[i2], d2.value[key]);
    });
  }
  visitTuple(_t, components, d2) {
    const form = d2.input.ui.form;
    components.forEach((type, i2) => {
      renderValue(type, form.form[i2], d2.value[i2]);
    });
  }
  visitVariant(_t, fields, d2) {
    const form = d2.input.ui.form;
    const selected = Object.entries(d2.value)[0];
    fields.forEach(([key, type], i2) => {
      if (key === selected[0]) {
        const open = form.ui.open;
        open.selectedIndex = i2;
        open.dispatchEvent(new Event(form.ui.event));
        renderValue(type, form.form[0], selected[1]);
      }
    });
  }
  visitVec(_t, ty, d2) {
    const form = d2.input.ui.form;
    const len = d2.value.length;
    const open = form.ui.open;
    open.value = len;
    open.dispatchEvent(new Event(form.ui.event));
    d2.value.forEach((v, i2) => {
      renderValue(ty, form.form[i2], v);
    });
  }
}
export {
  I as IDL,
  InputBox,
  InputForm,
  OptionForm,
  h as PipeArrayBuffer,
  RecordForm,
  Render,
  TupleForm,
  VariantForm,
  VecForm,
  j as compare,
  g as concat,
  i as idlLabelToId,
  inputBox,
  b as lebDecode,
  l as lebEncode,
  optForm,
  f as readIntLE,
  r as readUIntLE,
  recordForm,
  renderInput,
  renderValue,
  s as safeRead,
  a as safeReadUint8,
  d as slebDecode,
  c as slebEncode,
  tupleForm,
  k as uint8Equals,
  u as uint8FromBufLike,
  m as uint8ToDataView,
  variantForm,
  vecForm,
  e as writeIntLE,
  w as writeUIntLE
};
