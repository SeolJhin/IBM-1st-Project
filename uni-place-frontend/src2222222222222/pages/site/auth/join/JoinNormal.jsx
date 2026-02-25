import { useState } from "react";

const styles = `

  body {
    font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
    background: #fff;
    color: #333;
    font-size: 14px;
  }

  .signup-wrap {
    max-width: 1100px;
    margin: 0 auto;
    padding: 140px 20px 80px;
  }

  .signup-title {
    text-align: center;
    font-size: 28px;
    font-weight: 700;
    color: #222;
    margin-bottom: 50px;
  }

  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: #333;
    padding-bottom: 10px;
    border-bottom: 2px solid #333;
    margin-bottom: 0;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-bottom: 10px;
    border-bottom: 2px solid #333;
  }

  .required-note {
    font-size: 12px;
    color: #666;
  }

  .required-note span {
    color: #1a9ac9;
  }

  .form-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 40px;
  }

  .form-table tr {
    border-bottom: 1px solid #e5e5e5;
  }

  .form-table tr:first-child {
    border-top: none;
  }

  .form-table th {
    background: #f8f8f8;
    padding: 18px 20px;
    font-size: 14px;
    font-weight: 600;
    color: #444;
    text-align: left;
    width: 220px;
    vertical-align: middle;
  }

  .form-table td {
    padding: 14px 20px;
    vertical-align: middle;
  }

  .req {
    color: #1a9ac9;
    margin-left: 2px;
  }

  .form-input {
    width: 100%;
    max-width: 500px;
    height: 42px;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 0 12px;
    font-size: 14px;
    color: #333;
    outline: none;
    transition: border-color 0.2s;
  }

  .form-input:focus {
    border-color: #1a9ac9;
  }

  .form-input::placeholder {
    color: #aaa;
    font-size: 13px;
  }

  .radio-group {
    display: flex;
    gap: 30px;
    align-items: center;
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 14px;
    color: #444;
  }

  .radio-label input[type="radio"] {
    accent-color: #1a9ac9;
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .phone-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .phone-select {
    height: 42px;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 0 8px;
    font-size: 14px;
    color: #333;
    background: #fff;
    outline: none;
    cursor: pointer;
    min-width: 80px;
  }

  .phone-input {
    height: 42px;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 0 10px;
    font-size: 14px;
    color: #333;
    outline: none;
    width: 120px;
  }

  .phone-input:focus, .phone-select:focus {
    border-color: #1a9ac9;
  }

  .address-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 500px;
  }

  .address-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .btn-postcode {
    height: 42px;
    padding: 0 18px;
    background: #888;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
  }

  .btn-postcode:hover {
    background: #666;
  }

.address-input {
  flex: 1;
  height: 48px;              
  line-height: 48px;         
  border: 1px solid #ddd;
  border-radius: 3px;
  padding: 0 14px;           
  font-size: 14px;
  color: #333;
  outline: none;
}


  .address-input:focus {
    border-color: #1a9ac9;
  }

  .address-input::placeholder {
    color: #aaa;
    font-size: 13px;
  }

  .identity-btn {
    height: 42px;
    padding: 0 24px;
    background: #888;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-size: 14px;
    cursor: pointer;
    margin-right: 12px;
  }

  .identity-btn:hover {
    background: #666;
  }

  .identity-note {
    font-size: 13px;
    color: #555;
  }

  .auto-fill-note {
    font-size: 13px;
    color: #1a9ac9;
  }

  /* Pet section */
  .pet-rows {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .pet-row {
    display: flex;
    align-items: center;
    gap: 10px;
    // flex-wrap: wrap;
  }

  .pet-label {
    font-size: 13px;
    color: #555;
    min-width: 60px;
  }

  .pet-select {
    height: 38px;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 0 10px;
    font-size: 14px;
    color: #333;
    background: #fff;
    outline: none;
    cursor: pointer;
    min-width: 100px;
  }

  .pet-select:focus {
    border-color: #1a9ac9;
  }

  .pet-age-input {
    height: 38px;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 0 10px;
    font-size: 14px;
    color: #333;
    outline: none;
    width: 80px;
  }

  .pet-age-input:focus {
    border-color: #1a9ac9;
  }

  .pet-age-unit {
    font-size: 13px;
    color: #555;
  }

  .btn-add-pet {
    height: 34px;
    width: 34px;
    background: #1a9ac9;
    color: #fff;
    border: none;
    border-radius: 50%;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .btn-add-pet:hover {
    background: #1588b0;
  }

  .btn-remove-pet {
    height: 34px;
    width: 34px;
    background: #bbb;
    color: #fff;
    border: none;
    border-radius: 50%;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .btn-remove-pet:hover {
    background: #999;
  }

  .btn-remove-pet:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .add-pet-row {
    margin-top: 6px;
  }

  .employee-input {
    width: 100%;
    max-width: 500px;
    height: 42px;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 0 12px;
    font-size: 14px;
    color: #333;
    outline: none;
  }

  .employee-input:focus {
    border-color: #1a9ac9;
  }

  .submit-wrap {
    text-align: center;
    margin-top: 20px;
  }

  .btn-submit {
    height: 50px;
    padding: 0 60px;
    background: #1a9ac9;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    margin: 0 6px;
    transition: background 0.2s;
  }

  .btn-submit:hover {
    background: #1588b0;
  }

  .btn-cancel {
    height: 50px;
    padding: 0 60px;
    background: #888;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    margin: 0 6px;
    transition: background 0.2s;
  }

  .btn-cancel:hover {
    background: #666;
  }
`;

export default function JoinNormal() {
  const handleNumberOnlyChange = (e) => {
    const { name, value } = e.target;
    const onlyNumber = value.replace(/[^0-9]/g, "");

    setForm((prev) => ({
      ...prev,
      [name]: onlyNumber,
    }));
  };
  const openPostcode = () => {
    new window.daum.Postcode({
      oncomplete: function (data) {
        let fullAddress = data.address;
        let extraAddress = "";

        if (data.addressType === "R") {
          if (data.bname !== "") {
            extraAddress += data.bname;
          }
          if (data.buildingName !== "") {
            extraAddress +=
              extraAddress !== ""
                ? `, ${data.buildingName}`
                : data.buildingName;
          }
          fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
        }

        setForm((prev) => ({
          ...prev,
          postcode: data.zonecode,
          address: fullAddress,
        }));
      },
    }).open();
  };

  const [memberType, setMemberType] = useState("individual");
  const [form, setForm] = useState({
    id: "",
    password: "",
    passwordConfirm: "",
    name: "",
    email: "",
    tel1: "02",
    tel2: "",
    tel3: "",
    mobile1: "010",
    mobile2: "",
    mobile3: "",
    postcode: "",
    address: "",
    addressDetail: "",
    employeeId: "",
  });

  const [pets, setPets] = useState([{ type: "dog", age: "" }]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePetChange = (index, field, value) => {
    setPets((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addPet = () => {
    setPets((prev) => [...prev, { type: "dog", age: "" }]);
  };

  const removePet = (index) => {
    if (pets.length === 1) return;
    setPets((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <style>{styles}</style>
      <div className="signup-wrap">
        <h1 className="signup-title">회원가입</h1>

        {/* 회원구분 */}
        <p className="section-title">회원구분</p>
        <table className="form-table">
          <tbody>
            <tr>
              <th>회원구분</th>
              <td>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="memberType"
                      value="individual"
                      checked={memberType === "individual"}
                      onChange={() => setMemberType("individual")}
                    />
                    개인회원
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="memberType"
                      value="business"
                      checked={memberType === "business"}
                      onChange={() => setMemberType("business")}
                    />
                    사업자회원
                  </label>
                </div>
              </td>
            </tr>
            <tr>
              <th>회원인증</th>
              <td>
                <button className="identity-btn">본인인증</button>
                <span className="identity-note">
                  본인 명의의 휴대폰으로 본인인증을 진행합니다.
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 가입정보 */}
        <div className="section-header">
          <span
            className="section-title"
            style={{ borderBottom: "none", paddingBottom: 0 }}
          >
            가입정보
          </span>
          <span className="required-note">
            <span>*</span> 표시는 반드시 입력하셔야 합니다.
          </span>
        </div>
        <table className="form-table" style={{ borderTop: "2px solid #333" }}>
          <tbody>
            <tr>
              <th>
                아이디 <span className="req">*</span>
              </th>
              <td>
                <input
                  className="form-input"
                  type="text"
                  name="id"
                  value={form.id}
                  onChange={handleFormChange}
                  placeholder="영문 소문자/숫자 조합, 4~16자"
                />
              </td>
            </tr>
            <tr>
              <th>
                비밀번호 <span className="req">*</span>
              </th>
              <td>
                <input
                  className="form-input"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleFormChange}
                  placeholder="대소문자/숫자/특수문자 중 3가지 이상 조합, 8자~16자"
                />
              </td>
            </tr>
            <tr>
              <th>
                비밀번호 확인 <span className="req">*</span>
              </th>
              <td>
                <input
                  className="form-input"
                  type="password"
                  name="passwordConfirm"
                  value={form.passwordConfirm}
                  onChange={handleFormChange}
                />
              </td>
            </tr>
            <tr>
              <th>
                이름 <span className="req">*</span>
              </th>
              <td>
                <span className="auto-fill-note">
                  ※ 본인인증 후 자동 입력 됩니다.
                </span>
              </td>
            </tr>
            <tr>
              <th>
                이메일 <span className="req">*</span>
              </th>
              <td>
                <input
                  className="form-input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                />
              </td>
            </tr>
            <tr>
              <th>일반전화</th>
              <td>
                <div className="phone-group">
                  <select
                    className="phone-select"
                    name="tel1"
                    value={form.tel1}
                    onChange={handleNumberOnlyChange}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  >
                    <option value="02">02</option>
                    <option value="031">031</option>
                    <option value="032">032</option>
                    <option value="033">033</option>
                    <option value="041">041</option>
                    <option value="042">042</option>
                    <option value="043">043</option>
                    <option value="051">051</option>
                    <option value="052">052</option>
                    <option value="053">053</option>
                    <option value="054">054</option>
                    <option value="055">055</option>
                    <option value="061">061</option>
                    <option value="062">062</option>
                    <option value="063">063</option>
                    <option value="064">064</option>
                  </select>
                  <input
                    className="phone-input"
                    type="text"
                    name="mobile3"
                    value={form.mobile3}
                    onChange={handleNumberOnlyChange}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                  />
                  <input
                    className="phone-input"
                    type="text"
                    name="mobile3"
                    value={form.mobile3}
                    onChange={handleNumberOnlyChange}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <th>
                휴대전화 <span className="req">*</span>
              </th>
              <td>
                <div className="phone-group">
                  <select
                    className="phone-select"
                    name="mobile1"
                    value={form.mobile1}
                    onChange={handleNumberOnlyChange}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  >
                    <option value="010">010</option>
                    <option value="011">011</option>
                    <option value="016">016</option>
                    <option value="017">017</option>
                    <option value="018">018</option>
                    <option value="019">019</option>
                  </select>
                  <input
                    className="phone-input"
                    type="text"
                    name="mobile2"
                    value={form.mobile2}
                    onChange={handleFormChange}
                    maxLength={4}
                  />
                  <input
                    className="phone-input"
                    type="text"
                    name="mobile3"
                    value={form.mobile3}
                    onChange={handleFormChange}
                    maxLength={4}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <th>주소</th>
              <td>
                <div className="address-group">
                  <div className="address-row">
                    <input
                      className="address-input"
                      type="text"
                      name="postcode"
                      value={form.postcode}
                      onChange={handleFormChange}
                      style={{ maxWidth: 160 }}
                    />
                    <button
                      type="button"
                      className="btn-postcode"
                      onClick={openPostcode}
                    >
                      우편번호
                    </button>
                  </div>
                  <input
                    className="address-input"
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleFormChange}
                    placeholder="기본주소"
                  />
                  <input
                    className="address-input"
                    type="text"
                    name="addressDetail"
                    value={form.addressDetail}
                    onChange={handleFormChange}
                    placeholder="나머지주소"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 추가정보 */}
        <p className="section-title">추가정보</p>
        <table className="form-table" style={{ borderTop: "2px solid #333" }}>
          <tbody>
            <tr>
              <th>반려동물 정보</th>
              <td>
                <div className="pet-rows">
                  {pets.map((pet, index) => (
                    <div className="pet-row" key={index}>
                      <span className="pet-label">Pet {index + 1}</span>
                      <select
                        className="pet-select"
                        value={pet.type}
                        onChange={(e) =>
                          handlePetChange(index, "type", e.target.value)
                        }
                      >
                        <option value="dog">🐶 강아지 (Dog)</option>
                        <option value="cat">🐱 고양이 (Cat)</option>
                      </select>
                      <input
                        className="pet-age-input"
                        type="number"
                        min="0"
                        max="30"
                        value={pet.age}
                        onChange={(e) =>
                          handlePetChange(index, "age", e.target.value)
                        }
                        placeholder="나이"
                      />
                      <span className="pet-age-unit">살</span>
                      <button
                        className="btn-remove-pet"
                        onClick={() => removePet(index)}
                        disabled={pets.length === 1}
                        title="반려동물 삭제"
                      >
                        −
                      </button>
                      <button
                        className="btn-add-pet"
                        onClick={addPet}
                        title="반려동물 추가"
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="submit-wrap">
          <button className="btn-cancel">취소</button>
          <button className="btn-submit">가입하기</button>
        </div>
      </div>
    </>
  );
}
