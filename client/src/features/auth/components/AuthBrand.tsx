import rubixCubeLogo from "../../../assets/rubix-cube.png";

export function AuthBrand() {
  return (
    <div className="auth-brand">
      <img src={rubixCubeLogo} alt="" width={48} height={48} />
      <span>Rubix</span>
    </div>
  );
}
