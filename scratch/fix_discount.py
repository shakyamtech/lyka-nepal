import re

path = r'c:\Users\shaky\Downloads\Portfolio-Website-main\lyka-nepal\src\app\admin\account\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Match the Discount Given div with flexible whitespace
pattern = r'<label[^>]*?>Discount Given:</label>\s*<div[^>]*?>\s*<input[^>]*?type="number"[^>]*?placeholder="0"[^>]*?value=\{expDiscount\}[^>]*?onChange=\{e => setExpDiscount\(e.target.value\)\}[^>]*?style=\{\{ flex: 1, padding: "0.8rem", background: "var\(--admin-card\)", color: "#ef4444", border: "none", fontWeight: "bold", outline: "none" \}\}[^>]*?/>\s*<button[^>]*?onClick=\{\(\) => setExpDiscountType\(expDiscountType === "NPR" \? "%" : "NPR"\)\}[^>]*?>\s*\{expDiscountType === "NPR" \? "Rs." : "%"\}\s*</button>\s*</div>'

replacement = '<label style={{ fontSize: "0.7rem", display: "block", marginBottom: "4px", opacity: 0.7 }}>Discount (Amount or %):</label>\n                        <input \n                          type="text" \n                          placeholder="e.g. 500 or 10%" \n                          value={expDiscount} \n                          onChange={e => setExpDiscount(e.target.value)} \n                          style={{ padding: "0.8rem", width: "100%", background: "var(--admin-card)", color: "#ef4444", border: "1px solid #ef4444", fontWeight: "bold", outline: "none" }} \n                        />'

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

if new_content == content:
    print("No change made. Pattern did not match.")
else:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully updated the discount field.")
