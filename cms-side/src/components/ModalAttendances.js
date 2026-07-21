export default function ModalAttendances(props) {
  const { data, id } = props;

  const myModal = id;

  return (
    <>
      <>
        <input type="checkbox" id={myModal} className="modal-toggle" />
        <div className="modal">
          <div className="modal-box">
            {data.map((el) => {
              return (
                <>
                  <div className="flex justify-center">
                    <div className="mr-16">
                      <h3 className="text-lg text-black">{new Date(el.updatedAt).toLocaleString("id-ID", { weekday: "long" })}</h3>
                    </div>
                    <div className="mr-16">
                      <h3 className="text-lg text-black">{el.updatedAt.substring(0, 10)}</h3>
                    </div>
                    <div>
                      <h3 className="text-lg text-blue-800">{el.status}</h3>
                    </div>
                  </div>
                </>
              );
            })}

            <div className="modal-action">
              <label htmlFor={id} className="btn bg-gray-900 hover:bg-transparent hover:text-black">
                back
              </label>
            </div>
          </div>
        </div>
      </>
    </>
  );
}
